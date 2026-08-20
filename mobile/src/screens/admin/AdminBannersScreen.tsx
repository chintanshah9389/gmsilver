import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Switch,
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
import {
  useAdminBannersQuery,
  useAdminCreateBannerMutation,
  useAdminDeleteBannerMutation,
  useAdminUpdateBannerMutation,
} from '@/store/services/adminBannersApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

type ImageAsset = { uri: string; name: string; type: string };

export default function AdminBannersScreen({ navigation }: any) {
  const { data, error, isError, isFetching, refetch, isLoading } = useAdminBannersQuery(true);
  const [createBanner, createState] = useAdminCreateBannerMutation();
  const [updateBanner, updateState] = useAdminUpdateBannerMutation();
  const [deleteBanner] = useAdminDeleteBannerMutation();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkType, setLinkType] = useState('NONE');
  const [linkId, setLinkId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<ImageAsset | null>(null);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load banners.'));
  }, [error, isError]);

  const banners: any[] = data?.data || data || [];

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setImage({
      uri: asset.uri,
      name: asset.uri.split('/').pop() || 'banner.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
  };

  const openCreate = () => {
    setEditId(null);
    setTitle('');
    setSubtitle('');
    setLinkType('NONE');
    setLinkId('');
    setIsActive(true);
    setImage(null);
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setTitle(item.title || '');
    setSubtitle(item.subtitle || '');
    setLinkType(item.linkType || 'NONE');
    setLinkId(item.linkId || '');
    setIsActive(item.isActive ?? true);
    setImage(null);
    setOpen(true);
  };

  const onSave = async () => {
    if (!title.trim()) {
      setSnack('Title is required');
      return;
    }
    const form = new FormData();
    form.append('title', title.trim());
    if (subtitle.trim()) form.append('subtitle', subtitle.trim());
    form.append('linkType', linkType);
    if (linkId.trim()) form.append('linkId', linkId.trim());
    form.append('isActive', String(isActive));
    if (image) {
      form.append('image', {
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as any);
    }
    try {
      if (editId) {
        await updateBanner({ id: editId, body: form }).unwrap();
        setSnack('Banner updated');
      } else {
        await createBanner(form).unwrap();
        setSnack('Banner created');
      }
      setOpen(false);
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to save banner.'));
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete banner', 'Delete this banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBanner(id).unwrap();
            setSnack('Banner deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete banner.'));
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader
        title="Banners"
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
          data={Array.isArray(banners) ? banners : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={s.empty}>No banners</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 8 }}
                />
              ) : null}
              <View style={s.row}>
                <Text style={s.title}>{item.title}</Text>
                <View style={s.chip}>
                  <Text style={s.chipText}>{item.isActive ? 'ACTIVE' : 'OFF'}</Text>
                </View>
              </View>
              <Text style={s.meta}>{item.subtitle || item.linkType || '-'}</Text>
              <View style={s.actions}>
                <ScalePressable style={s.actionBtn} onPress={() => openEdit(item)}>
                  <Text style={s.actionText}>Edit</Text>
                </ScalePressable>
                <ScalePressable
                  style={[s.actionBtn, s.actionBtnDanger]}
                  onPress={() => onDelete(item.id)}
                >
                  <Text style={[s.actionText, s.actionTextDanger]}>Delete</Text>
                </ScalePressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={open} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={s.section}>{editId ? 'Edit banner' : 'New banner'}</Text>
            <TextInput
              style={s.input}
              placeholder="Title"
              placeholderTextColor={C.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={s.input}
              placeholder="Subtitle"
              placeholderTextColor={C.textMuted}
              value={subtitle}
              onChangeText={setSubtitle}
            />
            <TextInput
              style={s.input}
              placeholder="Link type (NONE/PRODUCT/CATEGORY)"
              placeholderTextColor={C.textMuted}
              value={linkType}
              onChangeText={(v) => setLinkType(v.toUpperCase())}
              autoCapitalize="characters"
            />
            <TextInput
              style={s.input}
              placeholder="Link ID (optional)"
              placeholderTextColor={C.textMuted}
              value={linkId}
              onChangeText={setLinkId}
              autoCapitalize="none"
            />
            <View style={[s.row, { marginBottom: 12 }]}>
              <Text style={s.label}>Active</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
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
