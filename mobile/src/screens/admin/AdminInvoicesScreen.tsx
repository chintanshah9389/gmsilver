import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import { useAdminOrdersQuery } from '@/store/services/adminOrdersApi';
import { useAdminDeleteInvoiceMutation } from '@/store/services/adminInvoicesApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

function money(v: unknown) {
  return `Rs. ${Number(v || 0).toLocaleString()}`;
}

export default function AdminInvoicesScreen({ navigation }: any) {
  const { data, error, isError, isFetching, refetch, isLoading } = useAdminOrdersQuery({
    page: 1,
    limit: 100,
  });
  const [deleteInvoice] = useAdminDeleteInvoiceMutation();
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load invoices.'));
  }, [error, isError]);

  const invoices = useMemo(() => {
    const orders: any[] = data?.data || [];
    return orders
      .filter((o) => o.invoice)
      .map((o) => ({
        ...o.invoice,
        orderNumber: o.orderNumber || o.id,
        total: o.grandTotal ?? o.totalAmount ?? o.total,
        customer: o.user?.name || o.user?.email,
      }));
  }, [data]);

  const onDelete = (id: string) => {
    Alert.alert('Delete invoice', 'Delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInvoice(id).unwrap();
            setSnack('Invoice deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete invoice.'));
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Invoices" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={s.empty}>No invoices yet</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.title}>Invoice · Order #{item.orderNumber}</Text>
              <Text style={s.meta}>
                {item.customer || '-'} · {money(item.total)}
              </Text>
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
