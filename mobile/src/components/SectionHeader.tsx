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
        <View style={s.titleRow}>
          <View style={s.dash} />
          <Text style={s.title}>{title}</Text>
        </View>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {onAction ? (
        <ScalePressable onPress={onAction} scaleTo={0.96} style={s.actionBtn}>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dash: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.gold,
  },
  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 24,
  },
  actionBtn: {
    backgroundColor: C.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  action: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
