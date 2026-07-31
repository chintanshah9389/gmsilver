import React from 'react';
import { StyleSheet, View } from 'react-native';
import { C } from '@/theme/colors';

export default function PremiumBackground() {
  return (
    <View pointerEvents="none" style={s.wrap}>
      <View style={[s.orb, s.orbTopRight]} />
      <View style={[s.orb, s.orbTopLeft]} />
      <View style={[s.orb, s.orbBottom]} />
      <View style={s.glowBand} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
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
  orbTopLeft: {
    top: 60,
    left: -120,
    width: 280,
    height: 280,
    backgroundColor: C.gradWine,
  },
  orbBottom: {
    bottom: -130,
    left: -90,
    width: 320,
    height: 320,
    backgroundColor: C.gradGold,
  },
  glowBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
});
