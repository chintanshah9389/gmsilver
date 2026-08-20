import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
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
      <View style={s.iconBox}>
        <Icon source={icon} size={26} color={C.ruby} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <ScalePressable style={s.btn} scaleTo={0.98} onPress={onAction}>
          <Text style={s.btnText}>{actionLabel}</Text>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: C.surface,
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontFamily: F.serif,
    textAlign: 'center',
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: F.sans,
  },
  btn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: C.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: R.xs,
  },
  btnText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
});
