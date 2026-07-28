import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text, Button, Snackbar } from 'react-native-paper';
import {
  useWishlistQuery,
  useRemoveWishlistMutation,
} from '@/store/services/wishlistApi';
import { getErrorMessage } from '@/lib/error-message';

export default function WishlistScreen({ navigation }: any) {
  const { data, error, isError } = useWishlistQuery();
  const [remove] = useRemoveWishlistMutation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const items = data?.data || [];

  useEffect(() => {
    if (isError && error) {
      setSnackbarMessage(getErrorMessage(error, 'Failed to load wishlist.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

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

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
      >
        {snackbarMessage}
      </Snackbar>
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
