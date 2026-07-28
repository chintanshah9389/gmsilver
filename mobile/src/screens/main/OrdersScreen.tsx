import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useMyOrdersQuery } from '@/store/services/ordersApi';

export default function OrdersScreen({ navigation }: any) {
  const { data } = useMyOrdersQuery({ page: 1, limit: 100 });
  const orders = data?.data || [];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() =>
            navigation.navigate('OrderDetail', { orderId: item.id })
          }
        >
          <Card.Content>
            <Text style={styles.title}>{item.orderNumber}</Text>
            <Text style={styles.sub}>
              ₹{Number(item.grandTotal).toLocaleString()}
            </Text>
            <Chip style={styles.chip}>{item.status}</Chip>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  listContent: { padding: 12 },
  card: { backgroundColor: '#151520', marginBottom: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
  chip: { marginTop: 8, alignSelf: 'flex-start' },
  empty: { color: '#AFAFBA', textAlign: 'center', marginTop: 24 },
});
