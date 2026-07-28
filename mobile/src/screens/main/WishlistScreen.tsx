import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import {
  useWishlistQuery,
  useRemoveWishlistMutation,
} from '@/store/services/wishlistApi';

export default function WishlistScreen({ navigation }: any) {
  const { data } = useWishlistQuery();
  const [remove] = useRemoveWishlistMutation();
  const items = data?.data || [];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>{item.product?.name}</Text>
            <Text style={styles.sub}>
              ₹{Number(item.product?.price || 0).toLocaleString()}
            </Text>
            <Button
              mode="text"
              onPress={() =>
                navigation.navigate('ProductDetail', {
                  productId: item.productId,
                })
              }
            >
              View
            </Button>
            <Button mode="outlined" onPress={() => remove(item.productId)}>
              Remove
            </Button>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No wishlist items</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  listContent: { padding: 12 },
  card: { backgroundColor: '#151520', marginBottom: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
  empty: { color: '#AFAFBA', textAlign: 'center', marginTop: 24 },
});
