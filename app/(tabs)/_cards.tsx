import { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import RNShare from 'react-native-share';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BlurView } from 'expo-blur';

import { colors, spacing, type, CARD_ASPECT } from '../../theme';
import { CameraCapture } from '../../components/CameraCapture';
import { VirtualIdCard, VirtualPayCard } from '../../components/VirtualCard';
import { readSecret } from '../../services/secure';
import { TAB_ORDER, useStore } from '../../store';
import type { IdDoc, PayCard } from '../../store/types';

export default function CardsStackScreen() {
  const router = useRouter();
  const cards = useStore((s) => s.cards);
  const docs = useStore((s) => s.docs);
  const isCardsTabActive = useStore((s) => TAB_ORDER[s.tabIndex] === 'cards');
  const items = [...cards, ...docs];
  const [activeShareId, setActiveShareId] = useState<string | null>(null);

  const W = Dimensions.get('window').width - spacing.screenX * 2;
  const cardH = W / CARD_ASPECT;
  const stackedStrip = cardH * 0.18;
  const fannedStep = cardH + 18;

  const expand = useSharedValue(0);
  const expandStart = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetY([-14, 14])
    .failOffsetX([-20, 20])
    .onBegin(() => {
      expandStart.value = expand.value;
    })
    .onUpdate((e) => {
      const delta = e.translationY / 180;
      expand.value = Math.min(1, Math.max(0, expandStart.value + delta));
    })
    .onEnd((e) => {
      const target =
        e.velocityY > 600
          ? 1
          : e.velocityY < -600
          ? 0
          : expand.value > 0.5
          ? 1
          : 0;
      expand.value = withSpring(target, { damping: 22, stiffness: 220, mass: 0.8 });
    });

  const onAdd = () => router.push('/camera/scan');

  const AddBtn = (
    <Pressable
      onPress={onAdd}
      accessibilityRole="button"
      accessibilityLabel="Add a card or document"
      style={({ pressed }) => [styles.addBtnWrap, pressed && { opacity: 0.85 }]}
    >
      <BlurView
        intensity={40}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.addBtnTint} />
      <Text style={styles.addBtnText}>ADD CARD</Text>
    </Pressable>
  );

  if (items.length === 0) {
    if (!isCardsTabActive) return <View style={styles.root} />;
    return <CameraCapture hideBack bottomInset={96} />;
  }

  const stackAreaHeight = fannedStep * items.length;

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <GestureDetector gesture={pan}>
        <View
          style={{
            flex: 1,
            paddingTop: 20,
            paddingHorizontal: spacing.screenX,
          }}
        >
          <View style={{ height: stackAreaHeight }}>
            {items
              .slice()
              .reverse()
              .map((item, i) => (
                <StackCard
                  key={item.id}
                  index={i}
                  total={items.length}
                  stackedStrip={stackedStrip}
                  fannedStep={fannedStep}
                  cardH={cardH}
                  width={W}
                  expand={expand}
                  showShare={activeShareId === item.id}
                  onTap={() =>
                    setActiveShareId((cur) => (cur === item.id ? null : item.id))
                  }
                  item={item}
                />
              ))}
          </View>
        </View>
      </GestureDetector>
      <View style={styles.addBtnOverlay} pointerEvents="box-none">{AddBtn}</View>
    </SafeAreaView>
  );
}

function StackCard({
  index,
  total,
  stackedStrip,
  fannedStep,
  width,
  expand,
  showShare,
  onTap,
  item,
}: {
  index: number;
  total: number;
  stackedStrip: number;
  fannedStep: number;
  cardH: number;
  width: number;
  expand: SharedValue<number>;
  showShare: boolean;
  onTap: () => void;
  item: PayCard | IdDoc;
}) {
  const cardRef = useRef<View>(null);

  const onShare = async () => {
    try {
      const path = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const url = path.startsWith('file://') ? path : `file://${path}`;

      let message: string;
      if (item.kind === 'pay') {
        const [pan, cvv] = await Promise.all([
          readSecret(`card_${item.id}_pan`),
          readSecret(`card_${item.id}_cvv`),
        ]);
        const number = pan ?? `•••• ${item.last4}`;
        message = [
          `Card: ${number}`,
          `Expiry: ${item.expiry}`,
          `CVV: ${cvv ?? '—'}`,
          `Bank: ${item.issuer ?? '—'}`,
          `Name: ${item.holder}`,
        ].join('\n');
      } else {
        const num = await readSecret(`doc_${item.id}_num`);
        message = `${item.docKind.toUpperCase()} · ${item.name} · ${num ?? item.maskedNumber}`;
      }

      await RNShare.open({
        url,
        type: 'image/png',
        message,
        failOnCancel: false,
      });
    } catch {}
  };
  const aStyle = useAnimatedStyle(() => {
    const e = expand.value;
    const stackedY = index * stackedStrip;
    const fannedY = index * fannedStep;
    const translateY = interpolate(e, [0, 1], [stackedY, fannedY]);
    const depth = total - 1 - index;
    const scale = interpolate(e, [0, 1], [1 - depth * 0.015, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }, { scale }],
      zIndex: index,
    };
  });

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0 },
        aStyle,
      ]}
    >
      <Pressable onPress={onTap} accessibilityRole="button">
        <View ref={cardRef} collapsable={false}>
          {item.kind === 'pay' ? (
            <VirtualPayCard card={item} width={width} />
          ) : (
            <VirtualIdCard doc={item} width={width} />
          )}
        </View>
        {showShare ? (
          <Pressable
            onPress={onShare}
            style={styles.shareBtn}
            accessibilityRole="button"
            accessibilityLabel="Share this card"
          >
            <Text style={styles.shareBtnText}>SHARE</Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  shareBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  shareBtnText: {
    ...type.mono10,
    color: colors.bg,
    letterSpacing: 1.6,
  },
  addBtnOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.tabBarHeight + 16,
  },
  addBtnWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  addBtnTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  addBtnText: {
    ...type.mono11,
    color: colors.ink,
    letterSpacing: 1.8,
  },
});
