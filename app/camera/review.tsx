import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import { getColors } from 'react-native-image-colors';

import { colors, CARD_ASPECT, radii, spacing, type } from '../../theme';
import { Eyebrow } from '../../components/Eyebrow';
import { IconArrow } from '../../components/Icons';
import { luhnValid, recognizeCard, recognizeId } from '../../services/ocr';
import { maskIdNumber, saveSecret } from '../../services/secure';
import type { CardBrand, CardType, IdDoc, IdKind, PayCard } from '../../store/types';
import { useStore } from '../../store';

const BRAND_OPTIONS: { key: CardBrand; label: string }[] = [
  { key: 'visa', label: 'VISA' },
  { key: 'mc', label: 'MASTERCARD' },
  { key: 'rupay', label: 'RUPAY' },
  { key: 'other', label: 'OTHER' },
];

const BRAND_GRADIENT: Record<CardBrand, readonly [string, string]> = {
  visa: colors.cardVisa,
  mc: colors.cardMc,
  rupay: colors.cardRupay,
  other: colors.cardOther,
};

function hexLum(hex: string): number {
  const h = hex.replace('#', '').slice(0, 6);
  if (h.length < 6) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const MIN_LUM = 0.18;

function firstBright(...candidates: (string | undefined | null)[]): string | undefined {
  for (const c of candidates) {
    if (c && hexLum(c) >= MIN_LUM) return c;
  }
  return undefined;
}

function pickAccent(
  r: Awaited<ReturnType<typeof getColors>>
): readonly [string, string] | undefined {
  if (r.platform === 'android') {
    const primary = firstBright(r.vibrant, r.lightVibrant, r.muted, r.lightMuted, r.dominant);
    const secondary = firstBright(
      r.darkVibrant,
      r.darkMuted,
      r.muted,
      r.dominant,
      primary
    );
    if (primary && secondary) return [primary, secondary];
    return undefined;
  }
  if (r.platform === 'ios') {
    const primary = firstBright(r.primary, r.detail, r.background, r.secondary);
    const secondary = firstBright(r.detail, r.secondary, r.background, primary);
    if (primary && secondary) return [primary, secondary];
    return undefined;
  }
  const any = r as {
    vibrant?: string;
    lightVibrant?: string;
    darkVibrant?: string;
    muted?: string;
    lightMuted?: string;
    darkMuted?: string;
    dominant?: string;
  };
  const primary = firstBright(any.vibrant, any.lightVibrant, any.muted, any.dominant);
  const secondary = firstBright(any.darkVibrant, any.darkMuted, any.muted, primary);
  if (primary && secondary) return [primary, secondary];
  return undefined;
}

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
}

function formatExpiry(raw: string, prev: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  // Allow backspacing through the slash.
  if (digits.length === 2 && prev.length === 3) return digits;
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CameraReview() {
  const router = useRouter();
  const { docType = 'CREDIT', photoUri, frontUri, backUri } =
    useLocalSearchParams<{
      docType?: string;
      photoUri?: string;
      frontUri?: string;
      backUri?: string;
    }>();
  const isPay = docType === 'CREDIT' || docType === 'DEBIT';
  const addCard = useStore((s) => s.addCard);
  const addDoc = useStore((s) => s.addDoc);

  const W = Dimensions.get('window').width - spacing.screenX * 2;
  const H = W / CARD_ASPECT;

  if (isPay) {
    return (
      <PayReview
        router={router}
        docType={docType as string}
        photoUri={photoUri as string | undefined}
        W={W}
        H={H}
        addCard={addCard}
      />
    );
  }

  return (
    <IdReview
      router={router}
      docType={docType as string}
      frontUri={frontUri as string | undefined}
      backUri={backUri as string | undefined}
      W={W}
      addDoc={addDoc}
    />
  );
}

// ── Pay card ────────────────────────────────────────────────────────────────
function PayReview({
  router,
  docType,
  photoUri,
  W,
  H,
  addCard,
}: {
  router: ReturnType<typeof useRouter>;
  docType: string;
  photoUri?: string;
  W: number;
  H: number;
  addCard: (c: PayCard) => void;
}) {
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [bank, setBank] = useState('');
  const [brand, setBrand] = useState<CardBrand>('visa');
  const [cardType, setCardType] = useState<'credit' | 'debit'>(
    docType === 'DEBIT' ? 'debit' : 'credit'
  );
  const [accent, setAccent] = useState<readonly [string, string] | undefined>();
  const [ocrState, setOcrState] = useState<'idle' | 'running' | 'done' | 'empty'>(
    photoUri ? 'running' : 'idle'
  );

  const numberRef = useRef<TextInput>(null);
  const holderRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);
  const bankRef = useRef<TextInput>(null);

  useEffect(() => {
    let cancelled = false;
    if (!photoUri) return;
    (async () => {
      const r = await recognizeCard(photoUri);
      if (cancelled) return;
      if (r.number) setNumber(formatCardNumber(r.number));
      if (r.expiry) setExpiry(r.expiry);
      if (r.holder) setHolder(r.holder);
      if (r.brand) setBrand(r.brand);
      const any = !!(r.number || r.expiry || r.holder);
      setOcrState(any ? 'done' : 'empty');
    })();
    (async () => {
      try {
        const res = await getColors(photoUri, {
          fallback: '#0a0a0b',
          cache: true,
          key: photoUri,
          quality: 'low',
        });
        if (cancelled) return;
        const pair = pickAccent(res);
        if (pair) setAccent(pair);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [photoUri]);

  const gradient: readonly [string, string] = accent ?? BRAND_GRADIENT[brand];
  const digitsOnly = number.replace(/\D/g, '');
  const numberValid = luhnValid(digitsOnly);
  const expiryValid = /^\d{2}\/\d{2}$/.test(expiry);
  const cvvValid = cvv.length >= 3 && cvv.length <= 4;
  const holderValid = holder.trim().length > 0;
  const bankValid = bank.trim().length > 0;
  const canSave =
    numberValid && expiryValid && cvvValid && holderValid && bankValid;

  const cleanupPhoto = async () => {
    if (!photoUri) return;
    try {
      await FileSystem.deleteAsync(photoUri, { idempotent: true });
    } catch {}
  };

  const onSave = async () => {
    if (!canSave) return;
    const last4 = digitsOnly.slice(-4);
    const id = `c_${Date.now()}`;
    try {
      await saveSecret(`card_${id}_pan`, digitsOnly);
      await saveSecret(`card_${id}_cvv`, cvv);
    } catch {}
    addCard({
      id,
      kind: 'pay',
      brand,
      cardType: cardType as CardType,
      last4,
      holder: holder.trim() || '—',
      expiry: expiry || '—',
      network: BRAND_OPTIONS.find((b) => b.key === brand)?.label,
      issuer: bank.trim() || undefined,
      accent,
    });
    // Wipe local copies before navigation.
    setNumber('');
    setCvv('');
    await cleanupPhoto();
    useStore.getState().setTabByName('cards');
    router.replace('/(tabs)');
  };

  useEffect(() => {
    return () => {
      // Defensive: clear photo if the screen unmounts without saving.
      if (photoUri) {
        FileSystem.deleteAsync(photoUri, { idempotent: true }).catch(() => {});
      }
    };
  }, [photoUri]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>REVIEW · TAP ANY FIELD TO EDIT</Eyebrow>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Captured.</Text>
          <Text style={styles.sub}>
            {ocrState === 'running'
              ? 'Reading card on-device…'
              : ocrState === 'empty'
              ? "Couldn't read the card. Tap any value to enter it."
              : 'Tap any value to edit. Brand opens a picker.'}
          </Text>

          <View style={{ height: 18 }} />

          <View style={[cardStyles.cardWrap, { width: W, height: H }]}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={cardStyles.border} pointerEvents="none" />

            <View style={cardStyles.body}>
              <View style={cardStyles.topRow}>
                <View style={cardStyles.chip}>
                  <View style={cardStyles.chipInner} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Pressable
                    onPress={() =>
                      setCardType((c) => (c === 'credit' ? 'debit' : 'credit'))
                    }
                    style={cardStyles.typePill}
                    accessibilityRole="button"
                    accessibilityLabel={`Card type ${cardType}, tap to toggle`}
                  >
                    <Text style={cardStyles.typePillText}>
                      {cardType.toUpperCase()}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => bankRef.current?.focus()} style={cardStyles.bankTap}>
                    <TextInput
                      ref={bankRef}
                      value={bank}
                      onChangeText={setBank}
                      placeholder="Bank"
                      placeholderTextColor={colors.inkFaint}
                      maxLength={24}
                      autoCapitalize="words"
                      style={[type.mono10, cardStyles.bankText]}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={() => numberRef.current?.focus()}>
                <Text style={cardStyles.microLabel}>CARD NUMBER</Text>
                <TextInput
                  ref={numberRef}
                  value={number}
                  onChangeText={(t) => setNumber(formatCardNumber(t))}
                  keyboardType="number-pad"
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.inkFaint}
                  maxLength={19}
                  style={[type.mono15, cardStyles.numberInput]}
                />
              </Pressable>

              <View style={cardStyles.bottomRow}>
                <Pressable onPress={() => holderRef.current?.focus()} style={{ flex: 1.4 }}>
                  <Text style={cardStyles.microLabel}>HOLDER</Text>
                  <TextInput
                    ref={holderRef}
                    value={holder}
                    onChangeText={setHolder}
                    placeholder="Name on card"
                    placeholderTextColor={colors.inkFaint}
                    maxLength={32}
                    autoCapitalize="words"
                    style={[type.body12, cardStyles.holderInput]}
                  />
                </Pressable>

                <Pressable onPress={() => expiryRef.current?.focus()} style={{ width: 74 }}>
                  <Text style={cardStyles.microLabel}>EXPIRY</Text>
                  <TextInput
                    ref={expiryRef}
                    value={expiry}
                    onChangeText={(t) => setExpiry(formatExpiry(t, expiry))}
                    keyboardType="number-pad"
                    placeholder="MM/YY"
                    placeholderTextColor={colors.inkFaint}
                    maxLength={5}
                    style={[type.mono11, cardStyles.expiryInput]}
                  />
                </Pressable>

                <Pressable onPress={() => cvvRef.current?.focus()} style={{ width: 54 }}>
                  <Text style={cardStyles.microLabel}>CVV</Text>
                  <TextInput
                    ref={cvvRef}
                    value={cvv}
                    onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    placeholder="123"
                    placeholderTextColor={colors.inkFaint}
                    maxLength={4}
                    style={[type.mono11, cardStyles.cvvInput]}
                  />
                </Pressable>

                <Pressable
                  onPress={() => {
                    const i = BRAND_OPTIONS.findIndex((b) => b.key === brand);
                    const next = BRAND_OPTIONS[(i + 1) % BRAND_OPTIONS.length];
                    setBrand(next.key);
                  }}
                  style={cardStyles.brandTap}
                  accessibilityRole="button"
                  accessibilityLabel={`Brand ${brand}, tap to change`}
                >
                  <Text style={cardStyles.microLabel}>TYPE</Text>
                  <Text style={[type.body12, cardStyles.brandText]}>
                    {BRAND_OPTIONS.find((b) => b.key === brand)?.label}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {photoUri ? (
            <View style={styles.thumbWrap}>
              <Eyebrow>SOURCE PHOTO</Eyebrow>
              <Image source={{ uri: photoUri }} style={styles.thumb} resizeMode="cover" />
            </View>
          ) : null}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable style={styles.ghostBtn} onPress={() => router.replace('/camera/scan')}>
          <Text style={styles.ghostBtnText}>RETAKE</Text>
        </Pressable>
        <Pressable
          style={[styles.primary, !canSave && { backgroundColor: colors.inkGhost }]}
          onPress={onSave}
          disabled={!canSave}
        >
          <Text style={[styles.primaryText, !canSave && { color: colors.inkFaint }]}>
            SAVE CARD
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

// ── ID doc ──────────────────────────────────────────────────────────────────
const ID_LABEL: Record<IdKind, string> = {
  pan: 'PAN',
  aadhaar: 'AADHAAR',
  dl: 'DRIVING LICENCE',
};

async function persistPhoto(uri: string, destName: string): Promise<string> {
  const dir = FileSystem.documentDirectory;
  if (!dir) return uri;
  const folder = `${dir}omni_docs/`;
  try {
    await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  } catch {}
  const dest = `${folder}${destName}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return dest;
  } catch {
    return uri;
  }
}

function IdReview({
  router,
  docType,
  frontUri,
  backUri,
  W,
  addDoc,
}: {
  router: ReturnType<typeof useRouter>;
  docType: string;
  frontUri?: string;
  backUri?: string;
  W: number;
  addDoc: (d: IdDoc) => void;
}) {
  const kind = docType.toLowerCase() as IdKind;
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [ocrState, setOcrState] = useState<'idle' | 'running' | 'done' | 'empty'>(
    frontUri ? 'running' : 'idle'
  );
  const savedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!frontUri) return;
    (async () => {
      const front = await recognizeId(kind, frontUri);
      if (cancelled) return;
      let num = front.number;
      let nm = front.name;
      if ((!num || !nm) && backUri) {
        const back = await recognizeId(kind, backUri);
        if (!num) num = back.number;
        if (!nm) nm = back.name;
      }
      if (num) setNumber(num);
      if (nm) setName(nm);
      setOcrState(num || nm ? 'done' : 'empty');
    })();
    return () => {
      cancelled = true;
    };
  }, [frontUri, backUri, kind]);

  const canSave = number.trim().length >= 4;

  const onSave = async () => {
    if (!canSave || !frontUri) return;
    savedRef.current = true;
    const id = `d_${Date.now()}`;
    const persistedFront = await persistPhoto(frontUri, `${id}_front.jpg`);
    const persistedBack = backUri ? await persistPhoto(backUri, `${id}_back.jpg`) : undefined;
    const cleanNumber = number.replace(/\s+/g, ' ').trim();
    try {
      await saveSecret(`doc_${id}_num`, cleanNumber);
    } catch {}
    addDoc({
      id,
      kind: 'id',
      docKind: kind,
      maskedNumber: maskIdNumber(cleanNumber),
      name: name.trim() || '—',
      frontUri: persistedFront,
      backUri: persistedBack,
    });
    useStore.getState().setTabByName('cards');
    router.replace('/(tabs)');
  };

  useEffect(() => {
    return () => {
      // Delete temp captures if user abandoned review without saving.
      if (savedRef.current) return;
      if (frontUri) FileSystem.deleteAsync(frontUri, { idempotent: true }).catch(() => {});
      if (backUri) FileSystem.deleteAsync(backUri, { idempotent: true }).catch(() => {});
    };
  }, [frontUri, backUri]);

  const photoH = Math.round(W / CARD_ASPECT);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>REVIEW · {ID_LABEL[kind]}</Eyebrow>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Captured.</Text>
          <Text style={styles.sub}>
            {ocrState === 'running'
              ? 'Reading number on-device…'
              : ocrState === 'empty'
              ? "Couldn't read the number. Type it below."
              : 'Edit the number or name if needed.'}
          </Text>

          <View style={{ height: 14 }} />

          <View style={idStyles.photoCol}>
            <Eyebrow>FRONT</Eyebrow>
            {frontUri ? (
              <Image
                source={{ uri: frontUri }}
                style={{ width: W, height: photoH, borderRadius: radii.md }}
                resizeMode="cover"
              />
            ) : (
              <View style={[idStyles.photoMissing, { width: W, height: photoH }]}>
                <Text style={[type.body13, { color: colors.inkDim }]}>No photo</Text>
              </View>
            )}
            <Eyebrow>BACK</Eyebrow>
            {backUri ? (
              <Image
                source={{ uri: backUri }}
                style={{ width: W, height: photoH, borderRadius: radii.md }}
                resizeMode="cover"
              />
            ) : (
              <View style={[idStyles.photoMissing, { width: W, height: photoH }]}>
                <Text style={[type.body13, { color: colors.inkDim }]}>No back photo</Text>
              </View>
            )}
          </View>

          <View style={{ height: 18 }} />

          <View style={{ gap: 10 }}>
            <View style={idStyles.row}>
              <Eyebrow>{kind === 'pan' ? 'PAN NUMBER' : kind === 'aadhaar' ? 'AADHAAR NUMBER' : 'DL NUMBER'}</Eyebrow>
              <TextInput
                value={number}
                onChangeText={setNumber}
                autoCapitalize={kind === 'aadhaar' ? 'none' : 'characters'}
                keyboardType={kind === 'aadhaar' ? 'number-pad' : 'default'}
                placeholder={
                  kind === 'pan'
                    ? 'ABCDE1234F'
                    : kind === 'aadhaar'
                    ? '1234 5678 9012'
                    : 'TS01 20230012345'
                }
                placeholderTextColor={colors.inkFaint}
                style={[type.mono15, { color: colors.ink, marginTop: 6 }]}
              />
            </View>
            <View style={idStyles.row}>
              <Eyebrow>NAME</Eyebrow>
              <TextInput
                value={name}
                onChangeText={setName}
                autoCapitalize="characters"
                placeholder="NAME AS ON DOCUMENT"
                placeholderTextColor={colors.inkFaint}
                style={[type.body14, { color: colors.ink, marginTop: 6 }]}
              />
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable style={styles.ghostBtn} onPress={() => router.replace('/camera/scan')}>
          <Text style={styles.ghostBtnText}>RETAKE</Text>
        </Pressable>
        <Pressable
          style={[styles.primary, !canSave && { backgroundColor: colors.inkGhost }]}
          onPress={onSave}
          disabled={!canSave}
        >
          <Text style={[styles.primaryText, !canSave && { color: colors.inkFaint }]}>
            SAVE TO STACK
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.screenX,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.screenX, paddingBottom: 60 },
  title: { ...type.display32, color: colors.ink },
  sub: { ...type.body14, color: colors.inkDim, marginTop: 8 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.screenX,
    paddingBottom: 32,
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  ghostBtnText: { ...type.mono11, color: colors.ink, letterSpacing: 1.2 },
  primary: {
    flex: 1.6,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  primaryText: { ...type.mono11, color: colors.bg, letterSpacing: 1.2 },
  thumbWrap: { marginTop: 22, gap: 8 },
  thumb: {
    width: '100%',
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
  },
});

const cardStyles = StyleSheet.create({
  cardWrap: { borderRadius: 18, overflow: 'hidden', alignSelf: 'center' },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  body: { flex: 1, padding: 18, justifyContent: 'space-between' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 30,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#c9b47a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  typePillText: {
    ...type.mono10,
    color: colors.ink,
    letterSpacing: 1.4,
  },
  bankTap: { maxWidth: 160 },
  bankText: {
    color: colors.inkDim,
    letterSpacing: 1.2,
    textAlign: 'right',
    padding: 0,
  },
  microLabel: {
    ...type.mono10,
    color: colors.inkFaint,
    letterSpacing: 1.2,
  },
  numberInput: {
    color: colors.ink,
    marginTop: 6,
    padding: 0,
    letterSpacing: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  holderInput: {
    color: colors.ink,
    marginTop: 4,
    padding: 0,
  },
  expiryInput: {
    color: colors.ink,
    marginTop: 4,
    padding: 0,
    letterSpacing: 1.5,
  },
  cvvInput: {
    color: colors.ink,
    marginTop: 4,
    padding: 0,
    letterSpacing: 2,
  },
  brandTap: { alignItems: 'flex-end' },
  brandText: {
    color: colors.ink,
    fontStyle: 'italic',
    marginTop: 4,
  },
  warn: {
    ...type.mono10,
    color: colors.urgent,
    letterSpacing: 1,
    marginTop: 4,
  },
});

const idStyles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  photoCol: { gap: 8 },
  photoMissing: {
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
