import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C, R } from '@/theme/colors';
import { E } from '@/theme/effects';
import ScalePressable from '@/components/ScalePressable';

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.wrap}>
      <View style={s.header}>
        {onBack ? (
          <ScalePressable style={s.backBtn} scaleTo={0.95} onPress={onBack}>
            <Icon source="chevron-left" size={22} color={C.text} />
          </ScalePressable>
        ) : null}
        <View style={s.titles}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={s.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={s.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
    ...E.softShadow,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: C.surface2,
  },
  titles: { flex: 1, minWidth: 0 },
  title: { color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  right: { marginLeft: 8, flexShrink: 0 },
});
