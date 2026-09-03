import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '@/theme/colors';

type PremiumBackgroundVariant = 'main' | 'auth';

interface PremiumBackgroundProps {
  variant?: PremiumBackgroundVariant;
  shimmer?: boolean;
}

/**
 * Soft pearl blush — one warm wash (not flat white, not patchy layers).
 */
export default function PremiumBackground({
  variant = 'main',
}: PremiumBackgroundProps) {
  const isAuth = variant === 'auth';

  return (
    <View pointerEvents="none" style={s.wrap}>
      <LinearGradient
        colors={
          isAuth
            ? ['#FFFBFA', '#FFF4F0', '#FFECE5']
            : [C.gradStart, C.gradMid, C.gradEnd]
        }
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
  },
});
