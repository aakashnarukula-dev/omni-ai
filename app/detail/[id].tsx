import { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { colors, CARD_ASPECT, radii, spacing, type } from '../../theme';
import { Eyebrow } from '../../components/Eyebrow';
import { IconArrow } from '../../components/Icons';
import { VirtualIdCard, VirtualPayCard } from '../../components/VirtualCard';
import { readSecret } from '../../services/secure';
import { useStore } from '../../store';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cards = useStore((s) => s.cards);
  const docs = useStore((s) => s.docs);

  const card = cards.find((c) => c.id === id);
  const doc = docs.find((d) => d.id === id);

  const W = Dimensions.get('window').width - spacing.screenX * 2;
  const photoH = W / CARD_ASPECT;

  const [fullNumber, setFullNumber] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (card) {
        const pan = await readSecret(`card_${card.id}_pan`);
        if (!cancelled) setFullNumber(pan);
      } else if (doc) {
        const num = await readSecret(`doc_${doc.id}_num`);
        if (!cancelled) setFullNumber(num);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [card, doc]);

  if (!card && !doc) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
        <Text style={{ ...type.body14, color: colors.ink }}>Not found.</Text>
      </SafeAreaView>
    );
  }

  const onCopy = async () => {
    const value = fullNumber ?? (card ? `•••• ${card.last4}` : doc?.maskedNumber ?? '');
    if (!value) return;
    await Clipboard.setStringAsync(value);
    Haptics.selectionAsync().catch(() => {});
  };

  const onShare = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      if (doc) {
        const numberToShare = fullNumber ?? doc.maskedNumber;
        await Share.share({
          message: `${doc.docKind.toUpperCase()} · ${doc.name} · ${numberToShare}`,
        });
      } else if (card) {
        await Share.share({
          message: `${card.issuer ?? ''} ${card.network ?? ''} · ${card.holder} · exp ${card.expiry}`.trim(),
        });
      }
    } catch {}
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>{card ? 'PAY CARD' : 'ID DOC'} · SECURE-STORE</Eyebrow>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {card ? (
          <VirtualPayCard card={card} width={W} fullNumber={fullNumber} />
        ) : doc ? (
          <VirtualIdCard doc={doc} width={W} />
        ) : null}

        <View style={{ height: 20 }} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable style={styles.actionBtn} onPress={onCopy}>
            <Text style={styles.actionText}>COPY NUMBER</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={onShare}>
            <Text style={styles.actionText}>SHARE</Text>
          </Pressable>
        </View>

        {doc && doc.frontUri ? (
          <View style={{ marginTop: 18, gap: 10 }}>
            <Eyebrow>FRONT PHOTO</Eyebrow>
            <Image
              source={{ uri: doc.frontUri }}
              style={{ width: W, height: photoH, borderRadius: radii.md }}
              resizeMode="cover"
            />
            {doc.backUri ? (
              <>
                <Eyebrow>BACK PHOTO</Eyebrow>
                <Image
                  source={{ uri: doc.backUri }}
                  style={{ width: W, height: photoH, borderRadius: radii.md }}
                  resizeMode="cover"
                />
              </>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 24 }} />
        <Eyebrow>METADATA</Eyebrow>
        <View style={{ gap: 10, marginTop: 10 }}>
          {card ? (
            <>
              <Row
                k="Number"
                v={fullNumber ?? `•••• •••• •••• ${card.last4}`}
                mono
              />
              <Row k="Issuer" v={card.issuer ?? '—'} />
              <Row k="Network" v={card.network ?? '—'} />
              <Row k="Holder" v={card.holder} />
              <Row k="Expiry" v={card.expiry} mono />
              <Row k="Last used" v={card.lastUsed ?? '—'} />
              {card.limitHint ? <Row k="Limit" v={card.limitHint} /> : null}
            </>
          ) : doc ? (
            <>
              <Row k="Type" v={doc.docKind.toUpperCase()} />
              <Row k="Linked name" v={doc.name} />
              <Row k="Number" v={fullNumber ?? doc.maskedNumber} mono />
              <Row k="Last verified" v={doc.lastVerified ?? '—'} />
            </>
          ) : null}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[type.mono10, { color: colors.inkFaint, letterSpacing: 1.2 }]}>
        {k.toUpperCase()}
      </Text>
      <Text
        style={[
          mono ? type.mono12 : type.body14,
          { color: colors.ink },
        ]}
      >
        {v}
      </Text>
    </View>
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
  body: { paddingHorizontal: spacing.screenX, paddingTop: 10 },
  row: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  actionText: { ...type.mono11, color: colors.bg, letterSpacing: 1.2 },
});
