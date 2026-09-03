import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { C } from '@/theme/colors';

/** Frosted tab bar fill — sits behind icons via tabBarBackground. */
export default function GlassTabBar() {
  const native = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View style={s.wrap}>
      {native ? (
        <BlurView
          intensity={55}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={native ? s.washNative : s.wash} />
      <View pointerEvents="none" style={s.edge} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.glassStrong,
  },
  washNative: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  edge: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.glassBorder,
  },
});
