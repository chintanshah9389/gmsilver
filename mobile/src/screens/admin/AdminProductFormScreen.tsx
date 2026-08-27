import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import GradientButton from '@/components/GradientButton';
import {
  useCategoriesQuery,
  useProductByIdQuery,
} from '@/store/services/productsApi';
import {
  useAdminCreateProductMutation,
  useAdminUpdateProductMutation,
} from '@/store/services/adminProductsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

type ImageAsset = { uri: string; name: string; type: string };

export default function AdminProductFormScreen({ navigation, route }: any) {
  const productId = route.params?.productId as string | undefined;
  const { data: productRes, isLoading: loadingProduct } = useProductByIdQuery(productId!, {
    skip: !productId,
  });
  const { data: catsRes } = useCategoriesQuery({ page: 1, limit: 200 });
  const [createProduct, createState] = useAdminCreateProductMutation();
  const [updateProduct, updateState] = useAdminUpdateProductMutation();
  const [snack, setSnack] = useState('');
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    weight: '',
    purity: '',
    origin: 'INDIAN',
    sku: '',
    categoryId: '',
    quantity: '0',
    isAvailable: 'true',
    isActive: 'true',
  });

  const product = productRes?.data || productRes;
  const categories: any[] = catsRes?.data || [];
  const inStock = form.isAvailable !== 'false';

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name || '',
      description: product.description || '',
      weight: product.weight != null ? String(product.weight) : '',
      purity: product.purity || '',
      origin: product.origin === 'IMPORTED' ? 'IMPORTED' : 'INDIAN',
      sku: product.sku || '',
      categoryId: product.categoryId || product.category?.id || '',
      quantity: String(product.quantity ?? 0),
      isAvailable: String(product.isAvailable ?? true),
      isActive: String(product.isActive ?? true),
    });
  }, [product]);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 3,
    });
    if (res.canceled || !res.assets?.length) return;
    setImages(
      res.assets.slice(0, 3).map((asset) => ({
        uri: asset.uri,
        name: asset.uri.split('/').pop() || 'product.jpg',
        type: asset.mimeType || 'image/jpeg',
      })),
    );
  };

  const onSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.categoryId) {
      setSnack('Name, SKU and category are required.');
      return;
    }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length) {
        body.append(key, String(value));
      }
    });
    images.forEach((img) => {
      body.append('images', {
        uri: img.uri,
        name: img.name,
        type: img.type,
      } as any);
    });
    try {
      if (productId) {
        await updateProduct({ id: productId, body }).unwrap();
        setSnack('Product updated');
      } else {
        await createProduct(body).unwrap();
        setSnack('Product created');
      }
      navigation.goBack();
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to save product.'));
    }
  };

  if (productId && loadingProduct) {
    return (
      <View style={s.root}>
        <PremiumBackground />
        <ScreenHeader title="Product" onBack={() => navigation.goBack()} />
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader
        title={productId ? 'Edit product' : 'New product'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={s.padded}>
        {(
          [
            ['name', 'Name'],
            ['sku', 'SKU'],
            ['weight', 'Weight'],
            ['purity', 'Purity'],
            ['quantity', 'Quantity'],
            ['description', 'Description'],
            ['categoryId', 'Category ID'],
          ] as const
        ).map(([key, label]) => (
          <View key={key}>
            <Text style={s.label}>{label}</Text>
            <TextInput
              style={s.input}
              placeholder={label}
              placeholderTextColor={C.textMuted}
              value={(form as any)[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              multiline={key === 'description'}
              keyboardType={
                key === 'quantity' || key === 'weight' ? 'decimal-pad' : 'default'
              }
            />
          </View>
        ))}

        <View style={[s.row, { marginBottom: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>In stock</Text>
            <Text style={s.meta}>
              {inStock ? 'Add to Cart enabled' : 'Shows Out of Stock on mobile'}
            </Text>
          </View>
          <Switch
            value={inStock}
            onValueChange={(v) => setForm((f) => ({ ...f, isAvailable: String(v) }))}
          />
        </View>

        <Text style={s.label}>Origin</Text>
        <View style={[s.row, { gap: 8, marginBottom: 12 }]}>
          <GradientButton
            label={form.origin === 'INDIAN' ? '✓ Indian' : 'Indian'}
            variant={form.origin === 'INDIAN' ? 'accent' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setForm((f) => ({ ...f, origin: 'INDIAN' }))}
          />
          <GradientButton
            label={form.origin === 'IMPORTED' ? '✓ Imported' : 'Imported'}
            variant={form.origin === 'IMPORTED' ? 'accent' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setForm((f) => ({ ...f, origin: 'IMPORTED' }))}
          />
        </View>

        <Text style={s.label}>Quick pick category</Text>
        {categories.slice(0, 12).map((c) => (
          <GradientButton
            key={c.id}
            label={form.categoryId === c.id ? `✓ ${c.name}` : c.name}
            variant={form.categoryId === c.id ? 'accent' : 'secondary'}
            style={{ marginBottom: 6 }}
            onPress={() => setForm((f) => ({ ...f, categoryId: c.id }))}
          />
        ))}

        <GradientButton
          label={images.length ? `${images.length} image(s) selected` : 'Pick images (max 3)'}
          variant="secondary"
          style={{ marginTop: 8 }}
          onPress={pickImages}
        />
        <GradientButton
          label="Save"
          style={{ marginTop: 12 }}
          loading={createState.isLoading || updateState.isLoading}
          onPress={onSave}
        />
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
