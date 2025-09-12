import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { colors, spacing, type } from '../theme';
import { Eyebrow } from './Eyebrow';
import { Waveform } from './Waveform';
import { useStore } from '../store';
import { classifyTranscript } from '../services/ai';
import { looksLikeQuestion } from '../services/assistant';
import { looksLikeCommand } from '../services/command';
import { speak } from '../services/tts';

export function VoiceOverlay() {
  const router = useRouter();
  const voice = useStore((s) => s.voice);
  const setVoiceState = useStore((s) => s.setVoiceState);
  const setTranscript = useStore((s) => s.setTranscript);
  const setAmplitude = useStore((s) => s.setAmplitude);
  const setClassifications = useStore((s) => s.setClassifications);
  const resetVoice = useStore((s) => s.resetVoice);
  const commitClassifications = useStore((s) => s.commitClassifications);

  const visible = voice.state === 'listening' || voice.state === 'transcribing';
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const committedRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const stoppedRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SILENCE_MS = 900;

  function joinTranscript(): string {
    const committed = committedRef.current.join(' ').trim();
    const interim = interimRef.current.trim();
    if (committed && interim) return `${committed} ${interim}`;
    return committed || interim;
  }

  function armSilenceTimer() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (!stoppedRef.current) finalize();
    }, SILENCE_MS);
  }

  useSpeechRecognitionEvent('result', (event) => {
    const t = event.results?.[0]?.transcript ?? '';
    if (!t) return;
    if (event.isFinal) {
      committedRef.current.push(t);
      interimRef.current = '';
    } else {
      interimRef.current = t;
    }
    setTranscript(joinTranscript());
    armSilenceTimer();
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    const v = typeof event.value === 'number' ? event.value : -2;
    const amp = Math.max(0, Math.min(1, (v + 2) / 12));
    setAmplitude(amp);
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.warn('speech error', event.error, event.message);
  });

  useSpeechRecognitionEvent('end', () => {
    if (!stoppedRef.current) finalize();
  });

  function cancelRecording() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
    resetVoice();
    setVoiceState('idle');
  }

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelRecording();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    stoppedRef.current = false;
    committedRef.current = [];
    interimRef.current = '';
    startedAtRef.current = Date.now();
    setElapsedMs(0);

    const int = setInterval(() => {
      if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
    }, 100);

    (async () => {
      try {
        const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted || cancelled) return;
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          continuous: true,
          volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
          requiresOnDeviceRecognition: false,
          addsPunctuation: true,
        });
      } catch (e) {
        console.warn('speech start failed', e);
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(int);
      startedAtRef.current = null;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (voice.state === 'transcribing' && !stoppedRef.current) {
      finalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.state]);

  function finalize() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}

    const finalTranscript = joinTranscript() || voice.transcript || '';
    setTranscript(finalTranscript);

    if (looksLikeCommand(finalTranscript)) {
      setVoiceState('idle');
      router.push({
        pathname: '/confirm',
        params: { q: finalTranscript },
      });
      return;
    }

    if (looksLikeQuestion(finalTranscript)) {
      setVoiceState('idle');
      router.push({
        pathname: '/assistant',
        params: { q: finalTranscript },
      });
      return;
    }

    classifyTranscript(finalTranscript)
      .then((items) => {
        const autoAccepted = items.map((it) => ({ ...it, accepted: true }));
        setClassifications(autoAccepted);
        commitClassifications();
        setVoiceState('idle');
        speak(summarize(autoAccepted));
      })
      .catch(() => {
        setVoiceState('idle');
        resetVoice();
        speak("Sorry, I couldn't process that.");
      });
  }

  if (!visible) return null;

  const secs = Math.floor(elapsedMs / 1000);
  const timer = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.scrim} />
      <View style={styles.content}>
        <View style={styles.top}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>
              {voice.state === 'transcribing' ? 'SORTING…' : 'LISTENING · ON-DEVICE STT'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={styles.timer}>{timer}</Text>
            <Pressable
              onPress={cancelRecording}
              hitSlop={14}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close voice overlay"
            >
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.center}>
          <Text style={styles.label}>Say anything.</Text>
          <Text style={styles.sub}>I'll sort it.</Text>

          <View style={{ height: 32 }} />
          <Waveform bars={30} height={120} amplitude={voice.amplitude} active />
        </View>

        <View style={styles.bottom}>
          <Eyebrow>LIVE TRANSCRIPT</Eyebrow>
          <Text style={styles.transcript} numberOfLines={4}>
            {voice.transcript || '…'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function summarize(items: { kind: string; title: string; due?: string }[]): string {
  if (!items.length) return "I didn't catch anything to save.";
  const tasks = items.filter((i) => i.kind === 'TASK');
  const alarms = items.filter((i) => i.kind === 'ALARM');
  const notes = items.filter((i) => i.kind === 'NOTE');
  const parts: string[] = [];
  if (alarms.length) {
    const a = alarms[0];
    parts.push(
      alarms.length === 1
        ? `Alarm set for ${a.due ?? 'eight'}`
        : `${alarms.length} alarms set`
    );
  }
  if (tasks.length) {
    parts.push(tasks.length === 1 ? `task added` : `${tasks.length} tasks added`);
  }
  if (notes.length) {
    parts.push(notes.length === 1 ? `note saved` : `${notes.length} notes saved`);
  }
  return parts.join(', ') + '.';
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 50,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,11,0.94)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 60,
    paddingBottom: 140,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(126,231,135,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(126,231,135,0.25)',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ok },
  badgeText: { ...type.mono10, color: colors.ok, letterSpacing: 0.8 },
  timer: { ...type.mono12, color: colors.inkDim, letterSpacing: 1.4 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    ...type.body14,
    color: colors.ink,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { ...type.display44, color: colors.ink },
  sub: {
    ...type.display32,
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    color: colors.inkFaint,
  },
  bottom: {
    gap: 8,
  },
  transcript: {
    ...type.body14,
    color: colors.ink,
    lineHeight: 22,
  },
});
