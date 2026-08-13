import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Text, StatusBar, Dimensions } from 'react-native';
import { C } from '@/theme/colors';

const { width: SW, height: SH } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(18)).current;
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          friction: 7,
          tension: 48,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lineWidth, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => navigation.replace('MpinLogin'), 2600);
    return () => clearTimeout(t);
  }, [
    navigation,
    logoScale,
    logoOpacity,
    brandOpacity,
    brandY,
    ringScale,
    ringOpacity,
    lineWidth,
    footerOpacity,
  ]);

  const lineAnimWidth = lineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 56],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1714" />

      {/* Deep charcoal luxury field */}
      <View style={s.field} />
      <View style={s.goldWashTop} />
      <View style={s.goldWashBottom} />
      <View style={s.vignette} />

      {/* Decorative arcs */}
      <Animated.View
        style={[
          s.arc,
          s.arcOuter,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View
        style={[
          s.arc,
          s.arcMid,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View
        style={[
          s.arc,
          s.arcInner,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />

      <View style={s.center}>
        <Animated.View
          style={[
            s.medallion,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <View style={s.medallionRing}>
            <View style={s.medallionCore}>
              <Text style={s.logoText}>GM</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: brandOpacity,
            transform: [{ translateY: brandY }],
            alignItems: 'center',
          }}
        >
          <Text style={s.brand}>GM SILVER</Text>
          <Animated.View style={[s.goldLine, { width: lineAnimWidth }]} />
          <Text style={s.tagline}>Fine silver · B2B catalog</Text>
        </Animated.View>
      </View>

      <Animated.View style={[s.footer, { opacity: footerOpacity }]}>
        <Text style={s.footerText}>CRAFT · QUALITY · TRUST</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1714',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1714',
  },
  goldWashTop: {
    position: 'absolute',
    top: -SH * 0.15,
    alignSelf: 'center',
    width: SW * 1.2,
    height: SH * 0.45,
    borderRadius: SW,
    backgroundColor: 'rgba(196, 165, 116, 0.10)',
  },
  goldWashBottom: {
    position: 'absolute',
    bottom: -SH * 0.2,
    alignSelf: 'center',
    width: SW * 1.1,
    height: SH * 0.4,
    borderRadius: SW,
    backgroundColor: 'rgba(196, 165, 116, 0.06)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  arc: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196, 165, 116, 0.22)',
  },
  arcOuter: {
    width: Math.min(SW * 0.78, 320),
    height: Math.min(SW * 0.78, 320),
  },
  arcMid: {
    width: Math.min(SW * 0.58, 240),
    height: Math.min(SW * 0.58, 240),
    borderColor: 'rgba(196, 165, 116, 0.32)',
  },
  arcInner: {
    width: Math.min(SW * 0.4, 168),
    height: Math.min(SW * 0.4, 168),
    borderColor: 'rgba(196, 165, 116, 0.42)',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  medallion: {
    marginBottom: 28,
  },
  medallionRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  medallionCore: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(196, 165, 116, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#F5E6C8',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brand: {
    color: '#F7F3EC',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 7,
  },
  goldLine: {
    height: 1.5,
    backgroundColor: C.gold,
    marginTop: 16,
    marginBottom: 14,
    borderRadius: 2,
  },
  tagline: {
    color: 'rgba(247,243,236,0.62)',
    fontSize: 13,
    letterSpacing: 1.6,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  footerText: {
    color: 'rgba(196, 165, 116, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.2,
  },
});
