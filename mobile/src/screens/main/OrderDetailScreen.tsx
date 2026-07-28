import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import {
  useOrderByIdQuery,
  useCancelOrderMutation,
} from '@/store/services/ordersApi';

export default function OrderDetailScreen({ route }: any) {
  const { orderId } = route.params;
  const { data } = useOrderByIdQuery(orderId);
  const [cancel] = useCancelOrderMutation();
  const order = data?.data;

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{order.orderNumber}</Text>
          <Text style={styles.sub}>Status: {order.status}</Text>
          <Text style={styles.sub}>
            Total: ₹{Number(order.grandTotal).toLocaleString()}
          </Text>
          {order.status === 'PENDING' ? (
            <Button mode="outlined" onPress={() => cancel(order.id)}>
              Cancel Order
            </Button>
          ) : null}
        </Card.Content>
      </Card>
      <FlatList
        data={order.items || []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>{item.product?.name}</Text>
              <Text style={styles.sub}>
                Qty: {item.quantity} | ₹{Number(item.rate).toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 12 },
  loadingText: { color: '#fff' },
  listContent: { paddingTop: 8 },
  card: { backgroundColor: '#151520', marginBottom: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
});
