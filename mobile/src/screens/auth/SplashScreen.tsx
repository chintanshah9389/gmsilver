import React, { useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';

const { width: SW, height: SH } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const progress = useSharedValue(0);
  const fold = useSharedValue(0);
  const pulse = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    fold.value = withDelay(80, withSpring(1, { damping: 14, stiffness: 88 }));
    pulse.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    shimmer.value = withDelay(
      700,
      withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, false),
    );

    const t = setTimeout(() => navigation.replace('MpinLogin'), 3400);
    return () => clearTimeout(t);
  }, [navigation, progress, fold, pulse, shimmer]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(progress.value, [0, 0.55], [0.7, 1], Extrapolation.CLAMP) },
      { rotate: `${interpolate(progress.value, [0, 0.55], [-8, 0], Extrapolation.CLAMP)}deg` },
    ],
  }));

  const foldLStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fold.value, [0, 1], [0, 0.9]),
    transform: [
      { translateX: interpolate(fold.value, [0, 1], [-SW * 0.4, 0]) },
      { rotate: `${-28 + pulse.value * 2}deg` },
    ],
  }));

  const foldRStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fold.value, [0, 1], [0, 0.85]),
    transform: [
      { translateX: interpolate(fold.value, [0, 1], [SW * 0.4, 0]) },
      { rotate: `${32 - pulse.value * 2}deg` },
    ],
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 0.75], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0.4, 0.8], [20, 0], Extrapolation.CLAMP) },
    ],
  }));

  const ruleStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0.55, 0.95], [0, 52], Extrapolation.CLAMP),
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.75, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.55, 0]),
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-40, 120]) },
      { rotate: '22deg' },
    ],
  }));

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <LinearGradient
        colors={[C.gradStart, C.bg, C.gradEnd]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[s.fold, s.foldL, foldLStyle]}>
        <LinearGradient
          colors={[C.facetA, C.facetC, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[s.fold, s.foldR, foldRStyle]}>
        <LinearGradient
          colors={[C.facetB, C.facetD, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={s.center}>
        <Animated.View style={[s.diamondWrap, logoStyle]}>
          <LinearGradient
            colors={[C.metalGradStart, C.metalGradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.diamond}
          >
            <View style={s.diamondInner}>
              <Text style={s.logoText}>GM</Text>
            </View>
            <Animated.View style={[s.shimmer, shimmerStyle]} pointerEvents="none">
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[s.brandBlock, brandStyle]}>
          <Text style={s.brand}>GM SILVER</Text>
          <Animated.View style={[s.rule, ruleStyle]} />
          <Text style={s.tagline}>Crystal craft · Origami light</Text>
        </Animated.View>
      </View>

      <Animated.View style={[s.footer, footerStyle]}>
        <Text style={s.footerText}>FACETED · MODERN · ELEGANT</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fold: {
    position: 'absolute',
    width: SW * 0.85,
    height: SH * 0.45,
    overflow: 'hidden',
  },
  foldL: {
    top: SH * 0.08,
    left: -SW * 0.2,
    borderRadius: 28,
  },
  foldR: {
    bottom: SH * 0.1,
    right: -SW * 0.22,
    borderRadius: 28,
  },
  center: { alignItems: 'center', zIndex: 2 },
  diamondWrap: {
    marginBottom: 28,
    ...E.glowShadow,
  },
  diamond: {
    width: 108,
    height: 108,
    borderRadius: 28,
    transform: [{ rotate: '12deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  diamondInner: {
    width: 82,
    height: 82,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
  },
  shimmer: {
    position: 'absolute',
    top: -30,
    width: 36,
    height: 160,
  },
  brandBlock: { alignItems: 'center' },
  brand: {
    color: C.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 5.5,
  },
  rule: {
    height: 2,
    backgroundColor: C.gold,
    marginTop: 16,
    marginBottom: 14,
  },
  tagline: {
    color: C.accent,
    fontSize: 13,
    letterSpacing: 1.1,
    fontWeight: '600',
  },
  footer: { position: 'absolute', bottom: 52 },
  footerText: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
