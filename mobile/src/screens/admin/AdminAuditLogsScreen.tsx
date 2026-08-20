import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import {
  useAdminAuditLogSummaryQuery,
  useAdminAuditLogsQuery,
  useAdminDeleteAuditLogMutation,
} from '@/store/services/adminAuditLogsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

export default function AdminAuditLogsScreen({ navigation }: any) {
  const [action, setAction] = useState('');
  const { data, error, isError, isFetching, refetch, isLoading } = useAdminAuditLogsQuery({
    page: 1,
    limit: 50,
    action: action.trim() || undefined,
  });
  const summary = useAdminAuditLogSummaryQuery();
  const [deleteLog] = useAdminDeleteAuditLogMutation();
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load audit logs.'));
  }, [error, isError]);

  const logs: any[] = data?.data || [];
  const sum = summary.data?.data || summary.data || {};

  const onDelete = (id: string) => {
    Alert.alert('Delete log', 'Delete this audit entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLog(id).unwrap();
            setSnack('Log deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete log.'));
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Audit Logs" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 16 }}>
        <TextInput
          style={s.input}
          placeholder="Filter by action"
          placeholderTextColor={C.textMuted}
          value={action}
          onChangeText={setAction}
          autoCapitalize="characters"
        />
        <View style={s.kpiGrid}>
          <View style={s.kpi}>
            <Text style={s.kpiValue}>{sum.total ?? sum.count ?? logs.length}</Text>
            <Text style={s.kpiLabel}>Total</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiValue}>{sum.today ?? '-'}</Text>
            <Text style={s.kpiLabel}>Today</Text>
          </View>
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.padded}
          refreshControl={
            <RefreshControl
              refreshing={isFetching || summary.isFetching}
              onRefresh={() => {
                refetch();
                summary.refetch();
              }}
            />
          }
          ListEmptyComponent={<Text style={s.empty}>No audit logs</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.title}>{item.action || item.event || 'Event'}</Text>
                <View style={s.chip}>
                  <Text style={s.chipText}>{item.entity || item.resource || 'SYS'}</Text>
                </View>
              </View>
              <Text style={s.meta}>
                {item.user?.email || item.userEmail || item.actor || 'System'} ·{' '}
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
              </Text>
              {item.details || item.message ? (
                <Text style={s.meta}>{item.details || item.message}</Text>
              ) : null}
              <View style={s.actions}>
                <ScalePressable
                  style={[s.actionBtn, s.actionBtnDanger]}
                  onPress={() => onDelete(item.id)}
                >
                  <Text style={[s.actionText, s.actionTextDanger]}>Delete</Text>
                </ScalePressable>
              </View>
            </View>
          )}
        />
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
