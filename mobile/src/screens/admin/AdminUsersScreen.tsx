import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import GradientButton from '@/components/GradientButton';
import {
  useAdminCreateUserMutation,
  useAdminDeleteUserMutation,
  useAdminUpdateUserCredentialsMutation,
  useAdminUpdateUserStatusMutation,
  useAdminUsersQuery,
} from '@/store/services/adminUsersApi';
import { getErrorMessage } from '@/lib/error-message';
import { isAdmin } from '@/lib/roles';
import { useAppSelector } from '@/hooks/redux';
import { C, R } from '@/theme/colors';
import { F } from '@/theme/typography';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'] as const;
const ROLES = ['CUSTOMER', 'ADMIN', 'OWNER'] as const;
type Status = (typeof STATUSES)[number];
type FilterId = 'ALL' | Status;

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  BLOCKED: 'Blocked',
};

/** Soft single-hue status tint — subtle, not patchy. */
const STATUS_TINT: Record<Status, string> = {
  PENDING: C.goldDim,
  APPROVED: C.success,
  REJECTED: C.chipPeachText,
  BLOCKED: C.textMuted,
};

function initials(name?: string) {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function AdminUsersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const role = useAppSelector((st) => st.auth.user?.role);
  const canAdmin = isAdmin(role);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<FilterId>('ALL');
  const [menuUser, setMenuUser] = useState<any | null>(null);
  const { data, error, isError, isFetching, refetch, isLoading } = useAdminUsersQuery({
    page: 1,
    limit: 100,
    search: debounced || undefined,
  });
  const [createUser, createState] = useAdminCreateUserMutation();
  const [updateStatus] = useAdminUpdateUserStatusMutation();
  const [updateCreds] = useAdminUpdateUserCredentialsMutation();
  const [deleteUser] = useAdminDeleteUserMutation();
  const [snack, setSnack] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [credsOpen, setCredsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
    status: 'APPROVED',
  });
  const [creds, setCreds] = useState({ password: '', mpin: '' });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load users.'));
  }, [error, isError]);

  const users: any[] = useMemo(() => data?.data || [], [data]);

  const counts = useMemo(() => {
    const base: Record<FilterId, number> = {
      ALL: users.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      BLOCKED: 0,
    };
    users.forEach((u) => {
      const st = u.status as Status;
      if (st && base[st] !== undefined) base[st] += 1;
    });
    return base;
  }, [users]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return users;
    return users.filter((u) => u.status === filter);
  }, [users, filter]);

  const applyStatus = async (id: string, status: string, name?: string) => {
    if (!canAdmin) {
      setSnack('Only ADMIN can change user status.');
      return;
    }
    try {
      await updateStatus({ id, status }).unwrap();
      setSnack(`${name || 'User'} → ${STATUS_LABEL[status as Status] || status}`);
      setMenuUser(null);
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to update status.'));
    }
  };

  const onStatus = (id: string, status: string, name?: string) => {
    Alert.alert(
      'Update status',
      `Set ${name || 'user'} to ${STATUS_LABEL[status as Status] || status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => applyStatus(id, status, name) },
      ],
    );
  };

  const onDelete = (id: string, name?: string) => {
    if (!canAdmin) {
      setSnack('Only ADMIN can delete users.');
      return;
    }
    Alert.alert('Delete user', `Remove ${name || 'this user'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id).unwrap();
            setSnack('User deleted');
            setMenuUser(null);
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete user.'));
          }
        },
      },
    ]);
  };

  const onCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setSnack('Name, email, and password are required.');
      return;
    }
    try {
      await createUser(form).unwrap();
      setCreateOpen(false);
      setForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'CUSTOMER',
        status: 'APPROVED',
      });
      setSnack('User created');
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to create user.'));
    }
  };

  const onCreds = async () => {
    if (!selectedId) return;
    if (!creds.password && !creds.mpin) {
      setSnack('Enter a new password or MPIN.');
      return;
    }
    try {
      await updateCreds({
        id: selectedId,
        password: creds.password || undefined,
        mpin: creds.mpin || undefined,
      }).unwrap();
      setCredsOpen(false);
      setCreds({ password: '', mpin: '' });
      setSnack('Credentials updated');
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to update credentials.'));
    }
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader
        title="Users"
        subtitle={`${counts.ALL} accounts`}
        onBack={() => navigation.goBack()}
        right={
          <ScalePressable onPress={() => setCreateOpen(true)} hitSlop={8}>
            <Text style={s.headerAction}>Add</Text>
          </ScalePressable>
        }
      />

      <View style={s.toolbar}>
        <View style={s.search}>
          <Icon source="magnify" size={18} color={C.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search users"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={s.tabs}>
        {(['ALL', ...STATUSES] as FilterId[]).map((id) => {
          const on = filter === id;
          return (
            <Pressable key={id} onPress={() => setFilter(id)} style={s.tab}>
              <Text style={[s.tabText, on && s.tabTextOn]}>
                {id === 'ALL' ? 'All' : STATUS_LABEL[id]}
                {counts[id] > 0 ? ` ${counts[id]}` : ''}
              </Text>
              {on ? <View style={s.tabUnderline} /> : null}
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={C.ruby} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={C.ruby}
            />
          }
          ListEmptyComponent={
            <Text style={s.empty}>No users in this list</Text>
          }
          renderItem={({ item }) => {
            const status = (item.status as Status) || 'PENDING';
            const tint = STATUS_TINT[status] || C.textMuted;
            return (
              <View style={s.card}>
                <View style={s.row}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initials(item.name)}</Text>
                  </View>
                  <View style={s.body}>
                    <Text style={s.name} numberOfLines={1}>
                      {item.name || 'Unnamed'}
                    </Text>
                    <Text style={s.line} numberOfLines={1}>
                      {item.email || '—'}
                    </Text>
                    <Text style={s.lineMuted} numberOfLines={1}>
                      {[item.role, item.phone, item.companyName, item.city]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    <Text style={[s.status, { color: tint }]}>
                      {STATUS_LABEL[status] || status}
                    </Text>
                  </View>
                  <ScalePressable
                    style={s.moreBtn}
                    onPress={() => setMenuUser(item)}
                  >
                    <Icon source="dots-vertical" size={20} color={C.textSub} />
                  </ScalePressable>
                </View>

                {canAdmin && status === 'PENDING' ? (
                  <View style={s.pendingActions}>
                    <ScalePressable
                      style={s.secondaryBtn}
                      onPress={() => onStatus(item.id, 'REJECTED', item.name)}
                    >
                      <Text style={s.secondaryBtnText}>Reject</Text>
                    </ScalePressable>
                    <ScalePressable
                      style={s.primaryBtn}
                      onPress={() => onStatus(item.id, 'APPROVED', item.name)}
                    >
                      <Text style={s.primaryBtnText}>Approve</Text>
                    </ScalePressable>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {/* Actions sheet */}
      <Modal visible={!!menuUser} animationType="fade" transparent>
        <View style={s.modalRoot}>
          <Pressable style={s.scrim} onPress={() => setMenuUser(null)} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{menuUser?.name || 'User'}</Text>
            <Text style={s.sheetSub}>{menuUser?.email}</Text>

            <Text style={s.groupLabel}>Set status</Text>
            {STATUSES.filter((st) => st !== menuUser?.status).map((st) => (
              <ScalePressable
                key={st}
                style={s.menuRow}
                disabled={!canAdmin}
                onPress={() => onStatus(menuUser.id, st, menuUser.name)}
              >
                <Text style={[s.menuRowText, { color: STATUS_TINT[st] }]}>
                  {STATUS_LABEL[st]}
                </Text>
              </ScalePressable>
            ))}

            <View style={s.divider} />

            <ScalePressable
              style={s.menuRow}
              onPress={() => {
                setSelectedId(menuUser.id);
                setSelectedName(menuUser.name || '');
                setCreds({ password: '', mpin: '' });
                setMenuUser(null);
                setCredsOpen(true);
              }}
            >
              <Text style={s.menuRowText}>Reset credentials</Text>
            </ScalePressable>

            {canAdmin ? (
              <ScalePressable
                style={s.menuRow}
                onPress={() => onDelete(menuUser.id, menuUser.name)}
              >
                <Text style={[s.menuRowText, { color: C.ruby }]}>Delete user</Text>
              </ScalePressable>
            ) : null}

            <ScalePressable style={s.cancelRow} onPress={() => setMenuUser(null)}>
              <Text style={s.cancelText}>Close</Text>
            </ScalePressable>
          </View>
        </View>
      </Modal>

      {/* Create */}
      <Modal visible={createOpen} animationType="slide" transparent>
        <View style={s.modalRoot}>
          <Pressable style={s.scrim} onPress={() => setCreateOpen(false)} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16), maxHeight: '90%' }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Add user</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {([
                { key: 'name', label: 'Name', ph: 'Full name' },
                { key: 'email', label: 'Email', ph: 'name@example.com' },
                { key: 'phone', label: 'Phone', ph: '+91…' },
                { key: 'password', label: 'Password', ph: 'Temporary password' },
              ] as const).map((f) => (
                <View key={f.key} style={s.field}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={f.ph}
                    placeholderTextColor={C.textMuted}
                    secureTextEntry={f.key === 'password'}
                    value={(form as any)[f.key]}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                    autoCapitalize={f.key === 'email' ? 'none' : 'sentences'}
                    keyboardType={
                      f.key === 'email'
                        ? 'email-address'
                        : f.key === 'phone'
                          ? 'phone-pad'
                          : 'default'
                    }
                  />
                </View>
              ))}

              <Text style={s.fieldLabel}>Role</Text>
              <View style={s.segment}>
                {ROLES.map((r) => {
                  const on = form.role === r;
                  return (
                    <Pressable
                      key={r}
                      style={[s.segmentItem, on && s.segmentItemOn]}
                      onPress={() => setForm((prev) => ({ ...prev, role: r }))}
                    >
                      <Text style={[s.segmentText, on && s.segmentTextOn]}>{r}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Status</Text>
              <View style={s.segment}>
                {STATUSES.map((st) => {
                  const on = form.status === st;
                  return (
                    <Pressable
                      key={st}
                      style={[s.segmentItem, on && s.segmentItemOn]}
                      onPress={() => setForm((prev) => ({ ...prev, status: st }))}
                    >
                      <Text style={[s.segmentText, on && s.segmentTextOn]}>
                        {STATUS_LABEL[st]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <GradientButton
                label="Create"
                loading={createState.isLoading}
                onPress={onCreate}
                style={{ marginTop: 18 }}
              />
              <GradientButton
                label="Cancel"
                variant="secondary"
                style={{ marginTop: 8, marginBottom: 8 }}
                onPress={() => setCreateOpen(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Credentials */}
      <Modal visible={credsOpen} animationType="slide" transparent>
        <View style={s.modalRoot}>
          <Pressable style={s.scrim} onPress={() => setCredsOpen(false)} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Credentials</Text>
            <Text style={s.sheetSub}>{selectedName || 'User'}</Text>
            <View style={s.field}>
              <Text style={s.fieldLabel}>New password</Text>
              <TextInput
                style={s.input}
                placeholder="Optional"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={creds.password}
                onChangeText={(v) => setCreds((c) => ({ ...c, password: v }))}
              />
            </View>
            <View style={s.field}>
              <Text style={s.fieldLabel}>New MPIN</Text>
              <TextInput
                style={s.input}
                placeholder="6 digits, optional"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={creds.mpin}
                onChangeText={(v) =>
                  setCreds((c) => ({ ...c, mpin: v.replace(/\D/g, '').slice(0, 6) }))
                }
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <GradientButton label="Save" onPress={onCreds} />
            <GradientButton
              label="Cancel"
              variant="secondary"
              style={{ marginTop: 8 }}
              onPress={() => setCredsOpen(false)}
            />
          </View>
        </View>
      </Modal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerAction: {
    color: C.ruby,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: F.sans,
    paddingHorizontal: 4,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: R.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    paddingVertical: 11,
    fontFamily: F.sans,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
    fontFamily: F.sans,
  },
  tabTextOn: {
    color: C.text,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.ruby,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: C.textSub,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  body: { flex: 1, minWidth: 0 },
  name: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  line: {
    color: C.textSub,
    fontSize: 13,
    marginTop: 2,
    fontFamily: F.sans,
  },
  lineMuted: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: F.sans,
  },
  status: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.borderHi,
    backgroundColor: C.surface,
  },
  secondaryBtnText: {
    color: C.textSub,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: R.md,
    backgroundColor: C.ruby,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  empty: {
    textAlign: 'center',
    color: C.textMuted,
    marginTop: 48,
    fontFamily: F.sans,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.bg3,
    marginBottom: 14,
  },
  sheetTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: F.sans,
  },
  sheetSub: {
    color: C.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
    fontFamily: F.sans,
  },
  groupLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: F.sans,
  },
  menuRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  menuRowText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: F.sans,
  },
  divider: {
    height: 8,
  },
  cancelRow: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: C.textMuted,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: F.sans,
  },
  field: { marginBottom: 12 },
  fieldLabel: {
    color: C.textSub,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: F.sans,
  },
  input: {
    backgroundColor: C.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
    fontFamily: F.sans,
  },
  segment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: R.sm,
  },
  segmentItemOn: {
    backgroundColor: C.surface,
  },
  segmentText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
    fontFamily: F.sans,
  },
  segmentTextOn: {
    color: C.text,
    fontWeight: '700',
  },
});
