import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import ScalePressable from '@/components/ScalePressable';

type EmptyStateProps = {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon = 'diamond-stone',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={s.wrap}>
      <LinearGradient colors={[C.facetA, C.facetB]} style={s.iconBox}>
        <Icon source={icon} size={28} color={C.goldDim} />
      </LinearGradient>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <ScalePressable style={s.btnWrap} scaleTo={0.97} onPress={onAction}>
          <LinearGradient
            colors={[C.goldGradStart, C.goldGradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.btn}
          >
            <Text style={s.btnText}>{actionLabel}</Text>
          </LinearGradient>
        </ScalePressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 56,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    transform: [{ rotate: '8deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  btnWrap: {
    marginTop: 20,
    borderRadius: R.sm,
    overflow: 'hidden',
    ...E.buttonShadow,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: R.sm,
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
