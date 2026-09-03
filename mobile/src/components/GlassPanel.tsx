import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { C, R } from '@/theme/colors';

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  radius?: number;
  strong?: boolean;
};

/** Frosted glass — real blur on native, translucent wash everywhere else. */
export default function GlassPanel({
  children,
  style,
  intensity = 48,
  radius = R.lg,
  strong = false,
}: Props) {
  const native = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View style={[s.clip, { borderRadius: radius }, style]}>
      {native ? (
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          s.wash,
          native && s.washNative,
          strong && (native ? s.washStrongNative : s.washStrong),
        ]}
      />
      <View pointerEvents="none" style={[s.edge, { borderRadius: radius }]} />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.glass,
  },
  washNative: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  washStrong: {
    backgroundColor: C.glassStrong,
  },
  washStrongNative: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  edge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: C.glassBorder,
    borderRadius: 0,
  },
});
