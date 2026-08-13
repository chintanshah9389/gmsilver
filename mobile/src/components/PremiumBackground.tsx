import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { C } from '@/theme/colors';

type PremiumBackgroundVariant = 'main' | 'auth';

interface PremiumBackgroundProps {
  variant?: PremiumBackgroundVariant;
  shimmer?: boolean;
}

/**
 * Clean luxury wash: soft ivory field + faint corner light.
 * Avoids stacked muddy orbs that compete with content.
 */
export default function PremiumBackground({
  variant = 'main',
  shimmer = false,
}: PremiumBackgroundProps) {
  const isAuth = variant === 'auth';
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shimmer) return;

    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 5200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => {
      loop.stop();
      shimmerAnim.setValue(0);
    };
  }, [shimmer, shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.04, 0.14, 0.04],
  });

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 320],
  });

  return (
    <View pointerEvents="none" style={s.wrap}>
      <View style={s.field} />

      {/* Soft top champagne veil */}
      <View style={[s.topVeil, isAuth && s.topVeilAuth]} />

      {/* Single corner lights — kept very faint */}
      <View style={[s.cornerLight, s.cornerTopRight, isAuth && s.cornerTopRightAuth]} />
      <View style={[s.cornerLight, s.cornerBottomLeft, isAuth && s.cornerBottomLeftAuth]} />

      {shimmer ? (
        <Animated.View
          style={[
            s.shimmerBand,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerX }, { rotate: '24deg' }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
  field: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FBF9F6',
  },
  topVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255,252,248,0.85)',
  },
  topVeilAuth: {
    height: '52%',
    backgroundColor: 'rgba(255,253,250,0.92)',
  },
  cornerLight: {
    position: 'absolute',
    borderRadius: 999,
  },
  cornerTopRight: {
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(196, 165, 116, 0.09)',
  },
  cornerTopRightAuth: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(196, 165, 116, 0.13)',
  },
  cornerBottomLeft: {
    bottom: -140,
    left: -100,
    width: 280,
    height: 280,
    backgroundColor: 'rgba(154, 149, 140, 0.07)',
  },
  cornerBottomLeftAuth: {
    width: 320,
    height: 320,
    backgroundColor: 'rgba(154, 149, 140, 0.10)',
  },
  shimmerBand: {
    position: 'absolute',
    top: -80,
    width: 90,
    height: '140%',
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
  },
});
