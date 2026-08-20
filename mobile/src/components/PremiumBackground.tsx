import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '@/theme/colors';

type PremiumBackgroundVariant = 'main' | 'auth';

interface PremiumBackgroundProps {
  variant?: PremiumBackgroundVariant;
  shimmer?: boolean;
}

/** Stitch Prestige field — quiet ivory, no decorative wash. */
export default function PremiumBackground({
  variant = 'main',
}: PremiumBackgroundProps) {
  const isAuth = variant === 'auth';

  useEffect(() => {
    // shimmer reserved for splash; keep this field still
  }, []);

  return (
    <View pointerEvents="none" style={s.wrap}>
      <LinearGradient
        colors={isAuth ? [C.ivory, C.bg, C.bg2] : [C.bg, C.bg, C.bg2]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
});
