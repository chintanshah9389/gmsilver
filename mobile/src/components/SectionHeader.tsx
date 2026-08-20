import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
import ScalePressable from '@/components/ScalePressable';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function SectionHeader({
  title,
  subtitle,
  actionLabel = 'See all',
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={s.wrap}>
      <View style={s.copy}>
        {subtitle ? <Text style={s.eyebrow}>{subtitle}</Text> : null}
        <Text style={s.title}>{title}</Text>
      </View>
      {onAction ? (
        <ScalePressable onPress={onAction} scaleTo={0.97} style={s.actionBtn}>
          <Text style={s.action}>{actionLabel}</Text>
        </ScalePressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 12,
  },
  copy: { paddingRight: 12 },
  eyebrow: {
    color: C.ruby,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontFamily: F.sans,
    marginBottom: 6,
  },
  title: {
    color: C.text,
    fontSize: 26,
    fontFamily: F.serif,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  action: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontFamily: F.sans,
  },
});
