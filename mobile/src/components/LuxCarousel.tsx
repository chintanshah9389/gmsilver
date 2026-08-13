import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import ScalePressable from '@/components/ScalePressable';

const { width: SW } = Dimensions.get('window');

export type LuxCarouselItem = {
  id: string;
  imageUrl?: string | null;
  title?: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
};

type LuxCarouselProps = {
  items: LuxCarouselItem[];
  height?: number;
  peek?: boolean;
  autoPlay?: boolean;
  autoPlayMs?: number;
  showDots?: boolean;
  onIndexChange?: (index: number) => void;
  activeIndex?: number;
  fullBleed?: boolean;
  borderRadius?: number;
};

const BADGE_COLORS: Record<string, string> = {
  NEW: C.success,
  SALE: C.error,
  MARKETING: C.goldDim,
  FEATURED: C.gold,
};

function Slide({
  item,
  index,
  scrollX,
  slideW,
  height,
  gap,
  borderRadius,
  fullBleed,
}: {
  item: LuxCarouselItem;
  index: number;
  scrollX: SharedValue<number>;
  slideW: number;
  height: number;
  gap: number;
  borderRadius: number;
  fullBleed: boolean;
}) {
  const animStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * (slideW + gap),
      index * (slideW + gap),
      (index + 1) * (slideW + gap),
    ];
    const scale = interpolate(scrollX.value, input, [0.92, 1, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, input, [0.7, 1, 0.7], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  const content = (
    <Animated.View
      style={[
        styles.slide,
        {
          width: slideW,
          height,
          borderRadius: fullBleed ? 0 : borderRadius,
          marginHorizontal: gap / 2,
        },
        animStyle,
        !fullBleed && E.cardShadow,
      ]}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{item.title?.[0]?.toUpperCase() ?? '✦'}</Text>
        </View>
      )}
      {(item.title || item.subtitle || item.badge) ? <View style={styles.overlay} /> : null}
      {item.badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: BADGE_COLORS[item.badge] ?? C.goldDim },
          ]}
        >
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      ) : null}
      {(item.title || item.subtitle) && (
        <View style={styles.textBox}>
          {item.title ? (
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          ) : null}
          {item.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </Animated.View>
  );

  if (item.onPress) {
    return (
      <ScalePressable scaleTo={0.985} onPress={item.onPress}>
        {content}
      </ScalePressable>
    );
  }
  return content;
}

export default function LuxCarousel({
  items,
  height = 200,
  peek = true,
  autoPlay = true,
  autoPlayMs = 3800,
  showDots = true,
  onIndexChange,
  activeIndex: controlledIndex,
  fullBleed = false,
  borderRadius = R.lg,
}: LuxCarouselProps) {
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const dragging = useRef(false);
  const scrollX = useSharedValue(0);

  const sidePad = peek && !fullBleed ? 20 : 0;
  const gap = peek && !fullBleed ? 12 : 0;
  const slideW = fullBleed ? SW : SW - sidePad * 2 - (peek ? 28 : 0);

  useEffect(() => {
    if (controlledIndex == null || controlledIndex === indexRef.current) return;
    indexRef.current = controlledIndex;
    setIndex(controlledIndex);
    listRef.current?.scrollToOffset({
      offset: controlledIndex * (slideW + gap),
      animated: true,
    });
  }, [controlledIndex, slideW, gap]);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    const id = setInterval(() => {
      if (dragging.current) return;
      const next = (indexRef.current + 1) % items.length;
      indexRef.current = next;
      setIndex(next);
      onIndexChange?.(next);
      listRef.current?.scrollToOffset({
        offset: next * (slideW + gap),
        animated: true,
      });
    }, autoPlayMs);
    return () => clearInterval(id);
  }, [autoPlay, autoPlayMs, items.length, slideW, gap, onIndexChange]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index == null) return;
      indexRef.current = first.index;
      setIndex(first.index);
      onIndexChange?.(first.index);
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 55 }).current;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.value = e.nativeEvent.contentOffset.x;
    },
    [scrollX],
  );

  if (items.length === 0) {
    return (
      <View style={[styles.emptyWrap, { height, borderRadius }]}>
        <Text style={styles.emptyText}>No highlights yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={slideW + gap}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{
          paddingHorizontal: sidePad + (peek && !fullBleed ? 14 : 0),
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onScrollEndDrag={() => {
          dragging.current = false;
        }}
        onMomentumScrollEnd={() => {
          dragging.current = false;
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index: i }) => (
          <Slide
            item={item}
            index={i}
            scrollX={scrollX}
            slideW={slideW}
            height={height}
            gap={gap}
            borderRadius={borderRadius}
            fullBleed={fullBleed}
          />
        )}
      />
      {showDots && items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  slide: {
    overflow: 'hidden',
    backgroundColor: C.surface3,
  },
  image: { ...StyleSheet.absoluteFillObject },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: C.textMuted, fontSize: 42, fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,21,22,0.32)',
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: R.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  textBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    marginTop: 4,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.silverLt,
  },
  dotActive: {
    width: 18,
    backgroundColor: C.primary,
  },
  emptyWrap: {
    marginHorizontal: 16,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: C.textMuted, fontSize: 13 },
});
