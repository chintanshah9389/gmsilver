import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, StatusBar } from 'react-native';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';

export default function SplashScreen({ navigation }: any) {
  const scale  = useRef(new Animated.Value(0.7)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(fade,   { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => navigation.replace('MpinLogin'), 2200);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={s.root}>
      <PremiumBackground variant="auth" shimmer />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Background rings */}
      <View style={[s.ring, s.ring1]} />
      <View style={[s.ring, s.ring2]} />
      <View style={[s.ring, s.ring3]} />

      <Animated.View style={{ opacity: fade, transform: [{ scale }, { translateY: slideY }], alignItems: 'center' }}>
        {/* Logo medallion */}
        <View style={s.medallion}>
          <View style={s.medallionInner}>
            <Text style={s.logoText}>GM</Text>
          </View>
        </View>

        {/* Brand name */}
        <Text style={s.brand}>GM SILVER</Text>
        <View style={s.divider} />
        <Text style={s.tagline}>B2B Silver Catalog Platform</Text>
      </Animated.View>

      {/* Footer dots */}
      <Animated.View style={[s.dotsRow, { opacity: fade }]}>
        {[0, 1, 2].map(i => <View key={i} style={[s.dot, i === 1 && s.dotActive]} />)}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  ring1: { width: 320, height: 320, borderColor: 'rgba(192,192,192,0.06)' },
  ring2: { width: 230, height: 230, borderColor: 'rgba(192,192,192,0.1)' },
  ring3: { width: 150, height: 150, borderColor: 'rgba(192,192,192,0.08)' },

  medallion: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: C.silver,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(192,192,192,0.08)',
    shadowColor: C.silver, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  medallionInner: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: 'rgba(192,192,192,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: C.silverLt, fontSize: 30, fontWeight: '800', letterSpacing: 2 },

  brand: {
    color: C.silverLt, fontSize: 22, fontWeight: '800',
    letterSpacing: 8, marginTop: 24,
  },
  divider: {
    width: 40, height: 1.5, backgroundColor: C.gold,
    borderRadius: 2, marginVertical: 12, opacity: 0.8,
  },
  tagline: { color: C.textSub, fontSize: 12, letterSpacing: 2, fontWeight: '500' },

  dotsRow: { position: 'absolute', bottom: 52, flexDirection: 'row', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.textMuted },
  dotActive: { width: 18, backgroundColor: C.silver },
});



