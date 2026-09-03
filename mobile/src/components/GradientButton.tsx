import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { C, R } from '@/theme/colors';
import ScalePressable from '@/components/ScalePressable';
import { F } from '@/theme/typography';

type GradientButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'accent';
};

export default function GradientButton({
  label,
  onPress,
  loading,
  disabled,
  style,
  variant = 'primary',
}: GradientButtonProps) {
  const isSecondary = variant === 'secondary';
  const isAccent = variant === 'accent';

  return (
    <ScalePressable
      style={[
        s.wrap,
        isSecondary && s.secondary,
        isAccent && s.accent,
        style,
        disabled && s.disabled,
      ]}
      scaleTo={0.98}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? C.text : '#fff'} size="small" />
      ) : (
        <Text style={[s.label, isSecondary && s.secondaryText]}>{label}</Text>
      )}
    </ScalePressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: R.pill,
    overflow: 'hidden',
    backgroundColor: C.ruby,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  accent: {
    backgroundColor: C.ruby,
  },
  secondary: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.primary,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
  secondaryText: {
    color: C.primary,
  },
  disabled: { opacity: 0.55 },
});
