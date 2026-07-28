import React from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useProductByIdQuery } from '@/store/services/productsApi';
import { useAddToCartMutation } from '@/store/services/cartApi';
import { useAddWishlistMutation } from '@/store/services/wishlistApi';

export default function ProductDetailScreen({ route }: any) {
  const { productId } = route.params;
  const { data } = useProductByIdQuery(productId);
  const [addToCart] = useAddToCartMutation();
  const [addWishlist] = useAddWishlistMutation();
  const product = data?.data;

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const onShare = async () => {
    const message = `${product.name} - ₹${Number(
      product.price
    ).toLocaleString()}\nCheck on GM Silver!`;
    await Share.share({
      message,
      title: product.name,
    });
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {product.name}
          </Text>
          <Text style={styles.sub}>
            ₹{Number(product.price).toLocaleString()}
          </Text>
          <Text style={styles.desc}>
            {product.description || 'No description'}
          </Text>
          <Button
            mode="contained"
            style={styles.btn}
            onPress={() => addToCart({ productId, quantity: 1 })}
          >
            Add To Cart
          </Button>
          <Button
            mode="outlined"
            style={styles.btn}
            onPress={() => addWishlist(productId)}
          >
            Add To Wishlist
          </Button>
          <Button mode="text" style={styles.btn} onPress={onShare}>
            Share Product
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 12 },
  loadingText: { color: '#fff' },
  card: { backgroundColor: '#151520' },
  title: { color: '#F2F2F2' },
  sub: { color: '#C0C0C0', marginTop: 6 },
  desc: { color: '#AFAFBA', marginTop: 12 },
  btn: { marginTop: 10 },
});
