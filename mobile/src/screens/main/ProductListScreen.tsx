import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text, Snackbar } from 'react-native-paper';
import { useProductsQuery } from '@/store/services/productsApi';
import { getErrorMessage } from '@/lib/error-message';

export default function ProductListScreen({ route, navigation }: any) {
  const categoryId = route.params?.categoryId;
  const { data, error, isError } = useProductsQuery({
    page: 1,
    limit: 100,
    categoryId,
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const products = data?.data || [];

  useEffect(() => {
    if (isError && error) {
      setSnackbarMessage(getErrorMessage(error, 'Failed to load products.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() =>
            navigation.navigate('ProductDetail', { productId: item.id })
          }
        >

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
        >
          {snackbarMessage}
        </Snackbar>
          <Card.Content>
            <Text variant="titleMedium" style={styles.title}>
              {item.name}
            </Text>
            <Text style={styles.sub}>
              ₹{Number(item.price).toLocaleString()}
            </Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  listContent: { padding: 12 },
  card: { backgroundColor: '#151520', marginBottom: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
});
