import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import { AdminStackParamList } from '@/navigation/types';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';
import { useAppSelector } from '@/hooks/redux';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminHub'>;

const ITEMS: { label: string; icon: string; route: keyof AdminStackParamList }[] = [
  { label: 'Users', icon: 'account-group-outline', route: 'AdminUsers' },
  { label: 'Orders', icon: 'package-variant-closed', route: 'AdminOrders' },
  { label: 'Notifications', icon: 'bell-outline', route: 'AdminNotifications' },
];

export default function AdminHubScreen({ navigation }: { navigation: Nav }) {
  const role = useAppSelector((s) => s.auth.user?.role);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Admin" subtitle={role || 'Staff'} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.groupLabel}>Manage</Text>
        {ITEMS.map((item) => (
          <ScalePressable
            key={item.route}
            scaleTo={0.98}
            style={s.row}
            onPress={() => navigation.navigate(item.route as any)}
          >
            <View style={s.iconWrap}>
              <Icon source={item.icon} size={20} color={C.ruby} />
            </View>
            <Text style={s.rowLabel}>{item.label}</Text>
            <Icon source="chevron-right" size={20} color={C.textMuted} />
          </ScalePressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  groupLabel: {
    color: C.textMuted,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: F.sans,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
  },
});
