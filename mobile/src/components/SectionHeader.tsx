import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/theme/colors';
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
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {onAction ? (
        <ScalePressable onPress={onAction} scaleTo={0.96}>
          <Text style={s.action}>{actionLabel}</Text>
        </ScalePressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
    marginTop: 8,
  },
  copy: { flex: 1, paddingRight: 12 },
  title: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  action: {
    color: C.goldDim,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
});
