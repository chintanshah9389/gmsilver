import React from 'react';
import { ScrollView, StyleSheet, Text, View, StatusBar } from 'react-native';
import { Icon } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/store/slices/authSlice';
import { clearRememberedSession } from '@/lib/remember-me';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';
import ScreenHeader from '@/components/ScreenHeader';

function MenuItem({
  icon,
  label,
  sub,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <ScalePressable style={s.menuItem} scaleTo={0.985} onPress={onPress}>
      <View style={[s.menuIconBox, danger && s.menuIconBoxDanger]}>
        <Icon source={icon} size={20} color={danger ? C.error : C.ruby} />
      </View>
      <View style={s.menuCopy}>
        <Text style={[s.menuLabel, danger && s.menuLabelDanger]}>{label}</Text>
        {sub ? <Text style={s.menuSub}>{sub}</Text> : null}
      </View>
      <Icon source="chevron-right" size={20} color={danger ? C.error : C.textMuted} />
    </ScalePressable>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const initial = user?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title="My Account"
        subtitle="Profile & preferences"
        onBack={navigation.canGoBack?.() ? () => navigation.goBack() : undefined}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <MotionReveal delay={40} duration={360} distance={12}>
          <View style={s.profileCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.profileCopy}>
              <Text style={s.userName}>{user?.name ?? 'User'}</Text>
              <Text style={s.userEmail}>{user?.email}</Text>
              {user?.phone ? <Text style={s.userPhone}>{user.phone}</Text> : null}
            </View>
          </View>
        </MotionReveal>

        <MotionReveal delay={90} duration={340} distance={10}>
          <View style={s.section}>
            <Text style={s.sectionLabel}>ACCOUNT</Text>
            <View style={s.menuCard}>
              <MenuItem
                icon="package-variant-closed"
                label="My Orders"
                sub="Track and review your orders"
                onPress={() => navigation.navigate('Orders')}
              />
              <View style={s.menuDivider} />
              <MenuItem
                icon="file-pdf-box"
                label="My Invoices"
                sub="Download invoice PDFs"
                onPress={() => navigation.navigate('Invoices')}
              />
              <View style={s.menuDivider} />
              <MenuItem
                icon="bell-outline"
                label="Notifications"
                sub="Offers and order updates"
                onPress={() => navigation.navigate('Notifications')}
              />
            </View>
          </View>
        </MotionReveal>

        <MotionReveal delay={130} duration={340} distance={10}>
          <View style={s.section}>
            <Text style={s.sectionLabel}>PREFERENCES</Text>
            <View style={s.menuCard}>
              <MenuItem
                icon="cog-outline"
                label="Settings"
                sub="Password, MPIN and security"
                onPress={() => navigation.navigate('Settings')}
              />
            </View>
          </View>
        </MotionReveal>

        <MotionReveal delay={170} duration={340} distance={10}>
          <View style={s.section}>
            <View style={s.menuCard}>
              <MenuItem
                icon="logout"
                label="Sign Out"
                onPress={() => {
                  void clearRememberedSession().finally(() => dispatch(logout()));
                }}
                danger
              />
            </View>
          </View>
        </MotionReveal>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 110 },
  profileCard: {
    marginHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...E.softShadow,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.goldSoft,
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.goldDim, fontSize: 22, fontWeight: '800' },
  profileCopy: { flex: 1, minWidth: 0 },
  userName: { color: C.text, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  userEmail: { color: C.textSub, fontSize: 13, marginTop: 2 },
  userPhone: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionLabel: { color: C.goldDim, fontSize: 10, fontWeight: '700', letterSpacing: 2.2, marginBottom: 9 },
  menuCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...E.softShadow,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconBoxDanger: { backgroundColor: 'rgba(196,92,92,0.12)' },
  menuCopy: { flex: 1, minWidth: 0 },
  menuLabel: { color: C.text, fontSize: 14, fontWeight: '600' },
  menuLabelDanger: { color: C.error },
  menuSub: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: C.border, marginLeft: 64 },
});
