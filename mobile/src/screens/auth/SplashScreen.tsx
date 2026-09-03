import React, { useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import BrandLogo from '@/components/BrandLogo';

const { width: SW } = Dimensions.get('window');
const LOGO_W = Math.min(300, SW * 0.78);

/**
 * Brand splash — original GM Silver logo on pearl field.
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

  return (
    <View style={styles.root}>
      <PremiumBackground variant="auth" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <BrandLogo width={LOGO_W} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
});
