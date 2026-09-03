import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  hasSeenSplashIntro,
  markSplashIntroSeen,
} from '@/lib/splash-intro';
import SplashIntroVideo from './SplashIntroVideo';

const { width: SW } = Dimensions.get('window');
const LOGO_W = Math.min(300, SW * 0.78);

/**
 * First launch: play brand intro video once (native + web).
 * Later launches: short logo splash, then MPIN login.
 */
export default function SplashScreen({ navigation }: any) {
  const [mode, setMode] = useState<'loading' | 'video' | 'logo'>('loading');
  const finishing = useRef(false);
  const progress = useSharedValue(0);
  const exit = useSharedValue(0);

  const goNext = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    await markSplashIntroSeen();
    navigation.replace('MpinLogin');
  }, [navigation]);

  const showLogo = useCallback(() => setMode('logo'), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await hasSeenSplashIntro();
      if (cancelled) return;
      setMode(seen ? 'logo' : 'video');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'logo') return;

    progress.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    const exitTimer = setTimeout(() => {
      exit.value = withTiming(1, { duration: 360, easing: Easing.in(Easing.cubic) });
    }, 1600);

    const navTimer = setTimeout(() => {
      void goNext();
    }, 2000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [mode, progress, exit, goNext]);

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

  if (mode === 'loading') {
    return (
      <View style={styles.root}>
        <PremiumBackground variant="auth" />
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      </View>
    );
  }

  if (mode === 'video') {
    return <SplashIntroVideo onDone={() => void goNext()} onFallback={showLogo} />;
  }

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
