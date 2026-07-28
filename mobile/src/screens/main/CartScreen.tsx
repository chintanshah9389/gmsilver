import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import {
  useCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '@/store/services/cartApi';

export default function CartScreen({ navigation }: any) {
  const { data } = useCartQuery();
  const [updateQty] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const cart = data?.data;
  const items = cart?.items || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>{item.product?.name}</Text>
              <Text style={styles.sub}>
                ₹{Number(item.product?.price || 0).toLocaleString()}
              </Text>
              <View style={styles.row}>
                <Button
                  mode="outlined"
                  onPress={() =>
                    updateQty({
                      productId: item.productId,
                      quantity: Math.max(1, item.quantity - 1),
                    })
                  }
                >
                  -
                </Button>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Button
                  mode="outlined"
                  onPress={() =>
                    updateQty({
                      productId: item.productId,
                      quantity: item.quantity + 1,
                    })
                  }
                >
                  +
                </Button>
                <Button mode="text" onPress={() => removeItem(item.productId)}>
                  Remove
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Cart is empty</Text>}
      />
      <Card style={styles.footer}>
        <Card.Content>
          <Text style={styles.total}>
            Subtotal: ₹{Number(cart?.subtotal || 0).toLocaleString()}
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Checkout')}
            disabled={!items.length}
          >
            Proceed to Checkout
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  card: { backgroundColor: '#151520', marginBottom: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  listContent: { padding: 12 },
  quantity: { color: '#fff', marginHorizontal: 12 },
  footer: { margin: 12, backgroundColor: '#151520' },
  total: { color: '#F2F2F2', marginBottom: 8 },
  empty: { color: '#AFAFBA', textAlign: 'center', marginTop: 24 },
});
