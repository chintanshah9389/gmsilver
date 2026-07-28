import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useCategoriesQuery } from '@/store/services/productsApi';

export default function CategoriesScreen({ navigation }: any) {
  const { data } = useCategoriesQuery({ page: 1, limit: 100 });
  const categories = data?.data || [];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={categories}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() =>
            navigation.navigate('ProductList', {
              categoryId: item.id,
              categoryName: item.name,
            })
          }
        >
          <Card.Content>
            <Text variant="titleMedium" style={styles.title}>
              {item.name}
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
});
