import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { C } from '@/theme/colors';
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
      <View style={[s.header, !onBack && s.headerNoBack]}>
        {onBack ? (
          <ScalePressable style={s.backBtn} scaleTo={0.95} onPress={onBack}>
            <Icon source="chevron-left" size={24} color={C.text} />
          </ScalePressable>
        ) : null}
        <View style={s.titles}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={s.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderHi,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...E.softShadow,
  },
  headerNoBack: { paddingLeft: 16 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: C.surface2,
  },
  titles: { flex: 1, minWidth: 0 },
  title: { color: C.text, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: {
    color: C.textSub,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  right: { marginLeft: 8, flexShrink: 0 },
});
