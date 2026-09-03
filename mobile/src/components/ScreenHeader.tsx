import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C } from '@/theme/colors';
import { F } from '@/theme/typography';
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
        ) : (
          <View style={s.backBtn} />
        )}
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
        {right ? <View style={s.right}>{right}</View> : <View style={s.backBtn} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1, minWidth: 0, alignItems: 'center' },
  title: {
    color: C.text,
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    color: C.goldDim,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontFamily: F.sans,
    fontWeight: '700',
  },
  right: { minWidth: 40, alignItems: 'flex-end', flexShrink: 0 },
});
