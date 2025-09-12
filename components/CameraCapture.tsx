import { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, CARD_ASPECT, spacing } from '../theme';
import { Eyebrow } from './Eyebrow';
import { Chip } from './Chip';
import { IconArrow } from './Icons';

const DOC_TYPES = ['CREDIT', 'DEBIT', 'PAN', 'AADHAAR', 'DL', 'OTHER'] as const;

function isIdDoc(t: string): boolean {
  return t === 'PAN' || t === 'AADHAAR' || t === 'DL';
}

type Props = {
  onClose?: () => void;
  /** Hide the top-left close button (used when embedded inside a tab). */
  hideBack?: boolean;
  /** Extra bottom padding to keep the shutter above a floating dock. */
  bottomInset?: number;
};

export function CameraCapture({ onClose, hideBack, bottomInset = 0 }: Props) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [docType, setDocType] =
    useState<(typeof DOC_TYPES)[number]>('CREDIT');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [frontUri, setFrontUri] = useState<string | undefined>();
  const cameraRef = useRef<CameraView | null>(null);
  const capturingRef = useRef(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission().catch(() => {});
  }, [permission, requestPermission]);

  const W = Dimensions.get('window').width - spacing.screenX * 2;
  const guideH = W / CARD_ASPECT;

  const scan = useSharedValue(0);
  useEffect(() => {
    scan.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [scan]);
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scan.value * (guideH - 4) }],
  }));

  const onShutter = async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    let photoUri: string | undefined;
    try {
      if (Platform.OS !== 'web' && cameraRef.current) {
        const pic = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        photoUri = pic?.uri;
      }
    } catch {}
    capturingRef.current = false;

    if (isIdDoc(docType)) {
      if (side === 'front') {
        setFrontUri(photoUri);
        setSide('back');
        return;
      }
      router.push({
        pathname: '/camera/review',
        params: {
          docType,
          ...(frontUri ? { frontUri } : {}),
          ...(photoUri ? { backUri: photoUri } : {}),
        },
      });
      setFrontUri(undefined);
      setSide('front');
      return;
    }

    router.push({
      pathname: '/camera/review',
      params: photoUri ? { docType, photoUri } : { docType },
    });
  };

  useEffect(() => {
    setSide('front');
    setFrontUri(undefined);
  }, [docType]);

  return (
    <View style={styles.root}>
      {Platform.OS !== 'web' && permission?.granted ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050507' }]} />
      )}

      {/* scrim with card-sized cutout */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.scrim, { flex: 1 }]} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.scrim, { width: spacing.screenX, height: guideH }]} />
          <View style={{ width: W, height: guideH }}>
            <View style={styles.guide}>
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />
              <Animated.View style={[styles.scanLine, scanStyle]} />
            </View>
          </View>
          <View style={[styles.scrim, { width: spacing.screenX, height: guideH }]} />
        </View>
        <View style={[styles.scrim, { flex: 1 }]} />
      </View>

      <SafeAreaView style={styles.overlay} edges={['top']}>
        <View style={styles.topBar}>
          {hideBack ? (
            <View style={{ width: 36 }} />
          ) : (
            <Pressable onPress={onClose ?? (() => router.back())} style={styles.backBtn}>
              <IconArrow dir="left" size={16} color={colors.ink} />
            </Pressable>
          )}
          <Eyebrow style={{ color: colors.ink }}>
            {isIdDoc(docType)
              ? `${docType} · ${side === 'front' ? 'FRONT' : 'BACK'}`
              : `ALIGN CARD · ${docType}`}
          </Eyebrow>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ flex: 1 }} />

        <View style={[styles.bottom, { paddingBottom: 24 + bottomInset }]}>
          <View style={styles.typeRow}>
            {DOC_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                solid={docType === t}
                active={docType === t}
                onPress={() => setDocType(t)}
              />
            ))}
          </View>
          <Pressable onPress={onShutter} style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </Pressable>
          <Eyebrow style={{ textAlign: 'center' }}>
            ON-DEVICE OCR · ML KIT · NEVER UPLOADED
          </Eyebrow>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const s: Record<string, object> = {
    tl: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
    tr: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
    bl: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
    br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  };
  return <View style={[styles.corner, s[pos]]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.55)' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingTop: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.ink,
  },
  scanLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.ink,
    opacity: 0.85,
  },
  bottom: {
    paddingHorizontal: spacing.screenX,
    gap: 14,
    alignItems: 'center',
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink,
  },
});
