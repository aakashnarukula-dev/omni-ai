import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, CARD_ASPECT, radii, type } from '../theme';
import { readSecret } from '../services/secure';
import type { PayCard, IdDoc } from '../store/types';

const BRAND_GRADIENT: Record<string, readonly [string, string]> = {
  visa: colors.cardVisa,
  mc: colors.cardMc,
  rupay: colors.cardRupay,
  other: colors.cardOther,
  pan: colors.cardPan,
  aadhaar: colors.cardAadhaar,
  dl: colors.cardOther,
};

type PayProps = { card: PayCard; width: number; fullNumber?: string | null };

function formatPan(d: string) {
  return d.replace(/\D/g, '').replace(/(.{4})(?=.)/g, '$1 ').trim();
}

export function VirtualPayCard({ card, width, fullNumber }: PayProps) {
  const height = width / CARD_ASPECT;
  const [loadedPan, setLoadedPan] = useState<string | null>(null);
  const [loadedCvv, setLoadedCvv] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pan, cvv] = await Promise.all([
        fullNumber ? Promise.resolve(null) : readSecret(`card_${card.id}_pan`),
        readSecret(`card_${card.id}_cvv`),
      ]);
      if (cancelled) return;
      if (pan) setLoadedPan(pan);
      setLoadedCvv(cvv);
    })();
    return () => {
      cancelled = true;
    };
  }, [card.id, fullNumber]);
  const pan = fullNumber ?? loadedPan;
  const gradient: readonly [string, string] =
    card.accent ?? BRAND_GRADIENT[card.brand] ?? colors.cardOther;
  const brandLabel = card.network?.toUpperCase() ?? card.brand.toUpperCase();
  const typeLabel =
    card.cardType === 'credit'
      ? 'CREDIT'
      : card.cardType === 'debit'
      ? 'DEBIT'
      : undefined;

  return (
    <View style={{ width, height, borderRadius: 18, overflow: 'hidden' }}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.border} />
      <View style={styles.payBody}>
        <View style={styles.topRow}>
          <View style={styles.chip}>
            <View style={styles.chipInner} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {typeLabel ? (
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{typeLabel}</Text>
              </View>
            ) : null}
            <Text style={[type.mono10, { color: colors.inkDim, letterSpacing: 1.2 }]}>
              {card.issuer?.toUpperCase() ?? 'ISSUER'}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.microLabel}>CARD NUMBER</Text>
          <Text style={[type.mono15, { color: colors.ink, marginTop: 4, letterSpacing: 2 }]}>
            {pan ? formatPan(pan) : `•••• •••• •••• ${card.last4}`}
          </Text>
          <View style={styles.bottomRow}>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.microLabel}>HOLDER</Text>
              <Text style={[type.body12, { color: colors.ink, marginTop: 4 }]}>{card.holder}</Text>
            </View>
            <View style={{ width: 64 }}>
              <Text style={styles.microLabel}>EXPIRY</Text>
              <Text style={[type.mono11, { color: colors.ink, marginTop: 4, letterSpacing: 1.5 }]}>
                {card.expiry}
              </Text>
            </View>
            <View style={{ width: 48 }}>
              <Text style={styles.microLabel}>CVV</Text>
              <Text style={[type.mono11, { color: colors.ink, marginTop: 4, letterSpacing: 2 }]}>
                {loadedCvv ?? '—'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.microLabel}>TYPE</Text>
              <Text
                style={[
                  type.body12,
                  { color: colors.ink, fontStyle: 'italic', marginTop: 4 },
                ]}
              >
                {brandLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

type IdProps = { doc: IdDoc; width: number };

const ID_LABEL: Record<string, string> = {
  pan: 'INCOME TAX · PAN',
  aadhaar: 'आधार · AADHAAR',
  dl: 'DRIVING LICENCE',
};

export function VirtualIdCard({ doc, width }: IdProps) {
  const height = width / CARD_ASPECT;
  const [fullNumber, setFullNumber] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const n = await readSecret(`doc_${doc.id}_num`);
      if (!cancelled) setFullNumber(n);
    })();
    return () => {
      cancelled = true;
    };
  }, [doc.id]);

  return (
    <View style={{ width, height, borderRadius: 18, overflow: 'hidden' }}>
      {doc.frontUri && doc.frontUri.length > 0 ? (
        <Image
          source={{ uri: doc.frontUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={BRAND_GRADIENT[doc.docKind] ?? colors.cardOther}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.border} />
      <View style={styles.payBody}>
        <View>
          <Text style={styles.microLabel}>{ID_LABEL[doc.docKind] ?? doc.docKind.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={[type.body14, { color: colors.ink }]}>{doc.name}</Text>
          <Text style={[type.mono15, { color: colors.ink, marginTop: 4, letterSpacing: 1.5 }]}>
            {fullNumber ?? doc.maskedNumber}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  payBody: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
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
    inset: 4 as unknown as number,
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  microLabel: {
    ...type.mono10,
    color: colors.inkFaint,
    letterSpacing: 1.2,
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
    fontFamily: 'JetBrainsMono_500Medium',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
});

export { CARD_ASPECT };
