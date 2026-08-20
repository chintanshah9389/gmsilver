import React, { useEffect } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C } from '@/theme/colors';

const { width: SW } = Dimensions.get('window');
const LOGO_W = Math.min(320, SW * 0.82);
const LOGO_H = LOGO_W * (286 / 500);

/**
 * Clean brand splash — pure white field so the mark merges with the backdrop.
 * One hero (logo), one motion (fade + settle), one accent (ruby rule).
 */
export default function SplashScreen({ navigation }: any) {
  const progress = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });

    const exitTimer = setTimeout(() => {
      exit.value = withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) });
    }, 2400);

    const navTimer = setTimeout(() => {
      navigation.replace('MpinLogin');
    }, 2850);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [navigation, progress, exit]);

  const logoStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(progress.value, [0, 0.55], [0, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(exit.value, [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: enterOpacity * exitOpacity,
      transform: [
        {
          translateY: interpolate(progress.value, [0, 0.7], [18, 0], Extrapolation.CLAMP),
        },
        {
          scale: interpolate(progress.value, [0, 0.7], [0.94, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const ruleStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(progress.value, [0.45, 0.85], [0, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(exit.value, [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: enterOpacity * exitOpacity,
      width: interpolate(progress.value, [0.4, 0.95], [0, 72], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(progress.value, [0.4, 0.9], [8, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(progress.value, [0.1, 0.5], [0, 1], Extrapolation.CLAMP) *
      interpolate(exit.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [0.85, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Soft brand glow behind the mark — same white field, subtle ruby wash */}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <Image
            source={require('@/assets/gm-silver-mark.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.rule, ruleStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SW * 0.9,
    height: SW * 0.9,
    borderRadius: SW,
    backgroundColor: 'rgba(227, 30, 36, 0.045)',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },
  rule: {
    height: 1.5,
    backgroundColor: C.ruby,
    marginTop: 28,
    borderRadius: 1,
  },
});
