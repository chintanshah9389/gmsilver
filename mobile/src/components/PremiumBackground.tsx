import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { C } from '@/theme/colors';

type PremiumBackgroundVariant = 'main' | 'auth';

interface PremiumBackgroundProps {
  variant?: PremiumBackgroundVariant;
  shimmer?: boolean;
}

export default function PremiumBackground({ variant = 'main', shimmer = false }: PremiumBackgroundProps) {
  const isAuth = variant === 'auth';
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shimmer) return;

    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => {
      loop.stop();
      shimmerAnim.setValue(0);
    };
  }, [shimmer, shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-460, 460],
  });

  return (
    <View pointerEvents="none" style={s.wrap}>
      <View style={isAuth ? s.baseGradientAuth : s.baseGradient} />
      <View style={isAuth ? s.pearlVeilAuth : s.pearlVeil} />
      <View style={[s.orb, isAuth ? s.orbTopRightAuth : s.orbTopRight]} />
      <View style={[s.orb, isAuth ? s.orbTopLeftAuth : s.orbTopLeft]} />
      <View style={[s.orb, isAuth ? s.orbBottomAuth : s.orbBottom]} />
      <View style={[s.orb, isAuth ? s.orbCenterAuth : s.orbCenter]} />
      <View style={[s.orb, isAuth ? s.orbChampagneAuth : s.orbChampagne]} />
      <View style={[s.orb, isAuth ? s.orbTealAuth : s.orbTeal]} />
      <View style={isAuth ? s.sheenBandAuth : s.sheenBand} />
      <View style={isAuth ? s.sheenBandSoftAuth : s.sheenBandSoft} />
      <View style={isAuth ? s.glowBandAuth : s.glowBand} />
      <View style={isAuth ? s.bottomLiftAuth : s.bottomLift} />
      <View style={isAuth ? s.edgeFrameAuth : s.edgeFrame} />
      {shimmer ? (
        <Animated.View
          style={[
            s.shimmerSweep,
            { transform: [{ translateX: shimmerTranslate }, { rotate: '18deg' }] },
          ]}
        />
      ) : null}
      <View style={s.noiseSoft} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  baseGradientAuth: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
  pearlVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,247,244,0.56)',
  },
  pearlVeilAuth: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(252,251,248,0.70)',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTopRight: {
    top: -140,
    right: -110,
    width: 360,
    height: 360,
    backgroundColor: C.gradSilver,
  },
  orbTopRightAuth: {
    top: -170,
    right: -100,
    width: 420,
    height: 420,
    backgroundColor: 'rgba(173, 186, 201, 0.34)',
  },
  orbTopLeft: {
    top: 50,
    left: -90,
    width: 280,
    height: 280,
    backgroundColor: C.gradWine,
  },
  orbTopLeftAuth: {
    top: 20,
    left: -120,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(140, 120, 184, 0.20)',
  },
  orbBottom: {
    bottom: -130,
    left: -90,
    width: 320,
    height: 320,
    backgroundColor: C.gradGold,
  },
  orbBottomAuth: {
    bottom: -140,
    left: -120,
    width: 360,
    height: 360,
    backgroundColor: 'rgba(216, 194, 154, 0.26)',
  },
  orbCenter: {
    top: '34%',
    left: '26%',
    width: 210,
    height: 210,
    backgroundColor: 'rgba(135, 169, 217, 0.10)',
  },
  orbCenterAuth: {
    top: '28%',
    left: '22%',
    width: 250,
    height: 250,
    backgroundColor: 'rgba(135, 169, 217, 0.18)',
  },
  orbChampagne: {
    bottom: 76,
    right: -60,
    width: 240,
    height: 240,
    backgroundColor: 'rgba(216, 194, 154, 0.16)',
  },
  orbChampagneAuth: {
    bottom: 56,
    right: -40,
    width: 280,
    height: 280,
    backgroundColor: 'rgba(216, 194, 154, 0.22)',
  },
  orbTeal: {
    top: '52%',
    left: -72,
    width: 190,
    height: 190,
    backgroundColor: 'rgba(78, 168, 161, 0.08)',
  },
  orbTealAuth: {
    top: '56%',
    left: -80,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(78, 168, 161, 0.13)',
  },
  sheenBand: {
    position: 'absolute',
    top: -40,
    right: -70,
    width: 280,
    height: 520,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.34)',
    transform: [{ rotate: '28deg' }],
  },
  sheenBandAuth: {
    position: 'absolute',
    top: -80,
    right: -54,
    width: 310,
    height: 620,
    borderRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.42)',
    transform: [{ rotate: '31deg' }],
  },
  sheenBandSoft: {
    position: 'absolute',
    top: 140,
    left: -120,
    width: 300,
    height: 460,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '-23deg' }],
  },
  sheenBandSoftAuth: {
    position: 'absolute',
    top: 120,
    left: -140,
    width: 340,
    height: 500,
    borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.24)',
    transform: [{ rotate: '-26deg' }],
  },
  glowBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  glowBandAuth: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  bottomLift: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  bottomLiftAuth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 250,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  edgeFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  edgeFrameAuth: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  shimmerSweep: {
    position: 'absolute',
    top: -120,
    left: -240,
    width: 180,
    height: 980,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 120,
  },
  noiseSoft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.014)',
  },
});
