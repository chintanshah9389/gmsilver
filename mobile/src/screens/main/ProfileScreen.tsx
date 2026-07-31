import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/store/slices/authSlice';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';

const MenuItem = ({ icon, label, sub, onPress, danger }: any) => (
  <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.75}>
    <View style={[s.menuIconBox, danger && s.menuIconBoxDanger]}>
      <Text style={s.menuIcon}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.menuLabel, danger && s.menuLabelDanger]}>{label}</Text>
      {sub ? <Text style={s.menuSub}>{sub}</Text> : null}
    </View>
    <Text style={s.menuChevron}>{'>'}</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerBg}>
          <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text></View>
          <Text style={s.userName}>{user?.name ?? 'User'}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          {user?.phone ? <Text style={s.userPhone}>{user.phone}</Text> : null}
        </View>

        {/* Menu */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <View style={s.menuCard}>
            <MenuItem icon="O" label="My Orders" sub="Track your orders" onPress={() => navigation.navigate('Orders')} />
            <View style={s.menuDivider} />
            <MenuItem icon="[PDF]" label="My Invoices" sub="Download invoices" onPress={() => navigation.navigate('Invoices')} />
            <View style={s.menuDivider} />
            <MenuItem icon="*" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>PREFERENCES</Text>
          <View style={s.menuCard}>
            <MenuItem icon="[SET]" label="Settings" sub="MPIN, password & more" onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.menuCard}>
            <MenuItem icon="<-" label="Sign Out" onPress={() => dispatch(logout())} danger />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerBg: { backgroundColor: C.surface, paddingTop: 60, paddingBottom: 28, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border, ...E.softShadow },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.surface2, borderWidth: 2, borderColor: C.silver, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: C.silverLt, fontSize: 28, fontWeight: '800' },
  userName: { color: C.text, fontSize: 19, fontWeight: '800', letterSpacing: 0.2 },
  userEmail: { color: C.textSub, fontSize: 13, marginTop: 2 },
  userPhone: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionLabel: { color: C.silver, fontSize: 10, fontWeight: '700', letterSpacing: 2.2, marginBottom: 9 },
  menuCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...E.softShadow },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  menuIconBoxDanger: { backgroundColor: 'rgba(255,76,76,0.12)' },
  menuIcon: { fontSize: 16 },
  menuLabel: { color: C.text, fontSize: 14, fontWeight: '600' },
  menuLabelDanger: { color: C.error },
  menuSub: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  menuChevron: { color: C.textMuted, fontSize: 18 },
  menuDivider: { height: 1, backgroundColor: C.border, marginLeft: 64 },
});


