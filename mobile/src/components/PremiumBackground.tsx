import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { C } from '@/theme/colors';

const { width: SW, height: SH } = Dimensions.get('window');

type PremiumBackgroundVariant = 'main' | 'auth';

interface PremiumBackgroundProps {
  variant?: PremiumBackgroundVariant;
  shimmer?: boolean;
}

/**
 * Crystal Origami field — folded geometric facets + soft iridescent gradients.
 */
export default function PremiumBackground({
  variant = 'main',
  shimmer = false,
}: PremiumBackgroundProps) {
  const isAuth = variant === 'auth';
  const pulse = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    if (shimmer) {
      drift.value = withRepeat(
        withTiming(1, { duration: 4800, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      );
    }
  }, [pulse, drift, shimmer]);

  const foldStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.25,
    transform: [{ rotate: `${-18 + pulse.value * 2}deg` }],
  }));

  const fold2Style = useAnimatedStyle(() => ({
    opacity: 0.4 + (1 - pulse.value) * 0.2,
    transform: [{ rotate: `${24 - pulse.value * 3}deg` }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drift.value, [0, 0.5, 1], [0.05, 0.16, 0.05]),
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-SW * 0.35, SW * 0.85]) },
      { rotate: '26deg' },
    ],
  }));

  return (
    <View pointerEvents="none" style={s.wrap}>
      <LinearGradient
        colors={[C.gradStart, C.bg, C.gradMid]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Origami fold A */}
      <Animated.View style={[s.facet, isAuth ? s.facetAAuth : s.facetA, foldStyle]}>
        <LinearGradient
          colors={[C.facetA, 'rgba(232,241,255,0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Origami fold B */}
      <Animated.View style={[s.facet, isAuth ? s.facetBAuth : s.facetB, fold2Style]}>
        <LinearGradient
          colors={[C.facetB, 'rgba(243,232,216,0.2)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Origami fold C */}
      <View style={[s.facet, s.facetC]}>
        <LinearGradient
          colors={[C.facetC, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Sharp crease lines */}
      <View style={[s.crease, s.crease1]} />
      <View style={[s.crease, s.crease2]} />

      {shimmer ? (
        <Animated.View style={[s.shimmerBand, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
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
  facet: {
    position: 'absolute',
    overflow: 'hidden',
  },
  facetA: {
    top: -SH * 0.05,
    right: -SW * 0.35,
    width: SW * 1.1,
    height: SW * 0.85,
    borderBottomLeftRadius: SW * 0.4,
  },
  facetAAuth: {
    top: -SH * 0.02,
    right: -SW * 0.3,
    width: SW * 1.15,
    height: SW * 0.9,
    borderBottomLeftRadius: SW * 0.45,
  },
  facetB: {
    bottom: -SH * 0.08,
    left: -SW * 0.4,
    width: SW * 1.15,
    height: SW * 0.9,
    borderTopRightRadius: SW * 0.5,
  },
  facetBAuth: {
    bottom: -SH * 0.05,
    left: -SW * 0.35,
    width: SW * 1.2,
    height: SW * 0.95,
    borderTopRightRadius: SW * 0.55,
  },
  facetC: {
    top: '42%',
    right: -SW * 0.15,
    width: SW * 0.55,
    height: SW * 0.55,
    borderRadius: 24,
    transform: [{ rotate: '35deg' }],
  },
  crease: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.05)',
  },
  crease1: {
    top: '28%',
    left: -40,
    width: SW * 0.7,
    transform: [{ rotate: '-12deg' }],
  },
  crease2: {
    bottom: '22%',
    right: -30,
    width: SW * 0.65,
    transform: [{ rotate: '18deg' }],
  },
  shimmerBand: {
    position: 'absolute',
    top: -100,
    width: 70,
    height: '150%',
  },
});
