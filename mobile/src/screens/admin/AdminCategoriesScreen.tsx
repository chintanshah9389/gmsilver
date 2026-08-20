import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import GradientButton from '@/components/GradientButton';
import { useCategoriesQuery } from '@/store/services/productsApi';
import {
  useAdminCreateCategoryMutation,
  useAdminDeleteCategoryMutation,
  useAdminUpdateCategoryMutation,
} from '@/store/services/adminCategoriesApi';
import { getErrorMessage } from '@/lib/error-message';
import { isAdmin } from '@/lib/roles';
import { useAppSelector } from '@/hooks/redux';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

type ImageAsset = { uri: string; name: string; type: string };

export default function AdminCategoriesScreen({ navigation }: any) {
  const role = useAppSelector((st) => st.auth.user?.role);
  const canDelete = isAdmin(role);
  const { data, error, isError, isFetching, refetch, isLoading } = useCategoriesQuery({
    page: 1,
    limit: 100,
  });
  const [createCat, createState] = useAdminCreateCategoryMutation();
  const [updateCat, updateState] = useAdminUpdateCategoryMutation();
  const [deleteCat] = useAdminDeleteCategoryMutation();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<ImageAsset | null>(null);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load categories.'));
  }, [error, isError]);

  const categories: any[] = data?.data || [];

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const nameFromUri = asset.uri.split('/').pop() || 'category.jpg';
    setImage({
      uri: asset.uri,
      name: nameFromUri,
      type: asset.mimeType || 'image/jpeg',
    });
  };

  const openCreate = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setImage(null);
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    setImage(null);
    setOpen(true);
  };

  const onSave = async () => {
    if (!name.trim()) {
      setSnack('Name is required');
      return;
    }
    const form = new FormData();
    form.append('name', name.trim());
    if (description.trim()) form.append('description', description.trim());
    form.append('isActive', 'true');
    if (image) {
      form.append('image', {
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as any);
    }
    try {
      if (editId) {
        await updateCat({ id: editId, body: form }).unwrap();
        setSnack('Category updated');
      } else {
        await createCat(form).unwrap();
        setSnack('Category created');
      }
      setOpen(false);
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to save category.'));
    }
  };

  const onDelete = (id: string) => {
    if (!canDelete) {
      setSnack('Only ADMIN can delete categories.');
      return;
    }
    Alert.alert('Delete category', 'Delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCat(id).unwrap();
            setSnack('Category deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete category.'));
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader
        title="Categories"
        onBack={() => navigation.goBack()}
        right={
          <ScalePressable onPress={openCreate}>
            <Text style={{ color: C.ruby, fontWeight: '700' }}>+</Text>
          </ScalePressable>
        }
      />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={s.empty}>No categories</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.row}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: 48, height: 48, borderRadius: 6 }}
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{item.name}</Text>
                  <Text style={s.meta}>{item.description || 'No description'}</Text>
                </View>
              </View>
              <View style={s.actions}>
                <ScalePressable style={s.actionBtn} onPress={() => openEdit(item)}>
                  <Text style={s.actionText}>Edit</Text>
                </ScalePressable>
                {canDelete ? (
                  <ScalePressable
                    style={[s.actionBtn, s.actionBtnDanger]}
                    onPress={() => onDelete(item.id)}
                  >
                    <Text style={[s.actionText, s.actionTextDanger]}>Delete</Text>
                  </ScalePressable>
                ) : null}
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={open} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={s.section}>{editId ? 'Edit category' : 'New category'}</Text>
            <TextInput
              style={s.input}
              placeholder="Name"
              placeholderTextColor={C.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={s.input}
              placeholder="Description"
              placeholderTextColor={C.textMuted}
              value={description}
              onChangeText={setDescription}
            />
            <GradientButton label={image ? 'Change image' : 'Pick image'} variant="secondary" onPress={pickImage} />
            <GradientButton
              label="Save"
              style={{ marginTop: 8 }}
              loading={createState.isLoading || updateState.isLoading}
              onPress={onSave}
            />
            <GradientButton
              label="Cancel"
              variant="secondary"
              style={{ marginTop: 8 }}
              onPress={() => setOpen(false)}
            />
          </View>
        </View>
      </Modal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
