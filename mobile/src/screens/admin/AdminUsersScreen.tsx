import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
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
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'] as const;

export default function AdminUsersScreen({ navigation }: any) {
  const role = useAppSelector((st) => st.auth.user?.role);
  const canAdmin = isAdmin(role);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
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

  const onStatus = (id: string, status: string) => {
    if (!canAdmin) {
      setSnack('Only ADMIN can change user status.');
      return;
    }
    Alert.alert('Update status', `Set user to ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateStatus({ id, status }).unwrap();
            setSnack(`Status updated to ${status}`);
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to update status.'));
          }
        },
      },
    ]);
  };

  const onDelete = (id: string) => {
    if (!canAdmin) {
      setSnack('Only ADMIN can delete users.');
      return;
    }
    Alert.alert('Delete user', 'This soft-deletes the user. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id).unwrap();
            setSnack('User deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete user.'));
          }
        },
      },
    ]);
  };

  const onCreate = async () => {
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
        onBack={() => navigation.goBack()}
        right={
          <ScalePressable onPress={() => setCreateOpen(true)}>
            <Text style={{ color: C.ruby, fontWeight: '700' }}>+</Text>
          </ScalePressable>
        }
      />
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <TextInput
          style={s.input}
          placeholder="Search users"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={s.empty}>No users found</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.title}>{item.name}</Text>
                <View style={s.chip}>
                  <Text style={s.chipText}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.meta}>
                {item.email} · {item.role}
              </Text>
              {(item.companyName || item.city) ? (
                <Text style={s.meta}>
                  {[item.companyName, item.city].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              <View style={s.actions}>
                {canAdmin &&
                  STATUSES.filter((st) => st !== item.status).map((st) => (
                    <ScalePressable
                      key={st}
                      style={s.actionBtn}
                      onPress={() => onStatus(item.id, st)}
                    >
                      <Text style={s.actionText}>{st}</Text>
                    </ScalePressable>
                  ))}
                <ScalePressable
                  style={s.actionBtn}
                  onPress={() => {
                    setSelectedId(item.id);
                    setCredsOpen(true);
                  }}
                >
                  <Text style={s.actionText}>Credentials</Text>
                </ScalePressable>
                {canAdmin ? (
                  <ScalePressable
                    style={[s.actionBtn, s.actionBtnDanger]}
                    onPress={() => onDelete(item.id)}
                  >
                    <Text style={[s.actionText, s.actionTextDanger]}>Delete</Text>
                  </ScalePressable>
                ) : null}
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={createOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={s.section}>Create user</Text>
            {(['name', 'email', 'phone', 'password'] as const).map((key) => (
              <TextInput
                key={key}
                style={s.input}
                placeholder={key}
                placeholderTextColor={C.textMuted}
                secureTextEntry={key === 'password'}
                value={(form as any)[key]}
                onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                autoCapitalize={key === 'email' ? 'none' : 'sentences'}
              />
            ))}
            <TextInput
              style={s.input}
              placeholder="role (CUSTOMER/ADMIN/OWNER)"
              placeholderTextColor={C.textMuted}
              value={form.role}
              onChangeText={(v) => setForm((f) => ({ ...f, role: v.toUpperCase() }))}
              autoCapitalize="characters"
            />
            <GradientButton label="Create" loading={createState.isLoading} onPress={onCreate} />
            <GradientButton
              label="Cancel"
              variant="secondary"
              style={{ marginTop: 8 }}
              onPress={() => setCreateOpen(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={credsOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={s.section}>Reset credentials</Text>
            <TextInput
              style={s.input}
              placeholder="New password (optional)"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={creds.password}
              onChangeText={(v) => setCreds((c) => ({ ...c, password: v }))}
            />
            <TextInput
              style={s.input}
              placeholder="New MPIN (optional)"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={creds.mpin}
              onChangeText={(v) => setCreds((c) => ({ ...c, mpin: v }))}
              keyboardType="number-pad"
            />
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
