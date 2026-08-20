import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import { useOrderByIdQuery } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

function money(v: unknown) {
  return `Rs. ${Number(v || 0).toLocaleString()}`;
}

export default function AdminOrderDetailScreen({ navigation, route }: any) {
  const { orderId } = route.params;
  const { data, error, isError, isLoading } = useOrderByIdQuery(orderId);
  const [snack, setSnack] = useState('');
  const order = data?.data || data;

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load order.'));
  }, [error, isError]);

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Order detail" onBack={() => navigation.goBack()} />
      {isLoading || !order ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <ScrollView contentContainerStyle={s.padded}>
          <View style={s.card}>
            <Text style={s.title}>#{order.orderNumber || order.id.slice(0, 8)}</Text>
            <Text style={s.meta}>Status: {order.status}</Text>
            <Text style={s.meta}>Total: {money(order.grandTotal ?? order.totalAmount ?? order.total)}</Text>
            <Text style={s.meta}>
              Customer: {order.user?.name || order.user?.email || '-'}
            </Text>
            {order.notes ? <Text style={s.meta}>Notes: {order.notes}</Text> : null}
          </View>
          <Text style={s.section}>Items</Text>
          {(order.items || []).map((item: any) => (
            <View key={item.id} style={s.card}>
              <Text style={s.title}>{item.product?.name || item.name || 'Item'}</Text>
              <Text style={s.meta}>
                Qty {item.quantity} · {money(item.price ?? item.unitPrice)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
