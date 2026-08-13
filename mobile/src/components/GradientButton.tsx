import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import ScalePressable from '@/components/ScalePressable';

type GradientButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
};

export default function GradientButton({
  label,
  onPress,
  loading,
  disabled,
  style,
  variant = 'primary',
}: GradientButtonProps) {
  if (variant === 'secondary') {
    return (
      <ScalePressable
        style={[s.secondary, style, disabled && s.disabled]}
        scaleTo={0.97}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <Text style={s.secondaryText}>{label}</Text>
      </ScalePressable>
    );
  }

  return (
    <ScalePressable
      style={[s.wrap, style, disabled && s.disabled]}
      scaleTo={0.97}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={[C.goldGradStart, C.goldGradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.label}>{label}</Text>
        )}
      </LinearGradient>
    </ScalePressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: R.sm,
    overflow: 'hidden',
    ...E.buttonShadow,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.sm,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  secondary: {
    borderRadius: R.sm,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderHi,
    backgroundColor: C.surface,
  },
  secondaryText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: { opacity: 0.6 },
});
