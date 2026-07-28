import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Text, Searchbar } from 'react-native-paper';
import { useProductsQuery } from '@/store/services/productsApi';

export default function HomeScreen({ navigation }: any) {
  const { data } = useProductsQuery({ page: 1, limit: 20 });
  const products = data?.data || [];

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search silver products"
        value=""
        onChangeText={() => {}}
        style={styles.search}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: item.id })
            }
          >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 12 },
  search: { marginBottom: 12 },
  card: { backgroundColor: '#151520', marginBottom: 10 },
  title: { color: '#F2F2F2' },
  sub: { color: '#AFAFBA', marginTop: 4 },
});
