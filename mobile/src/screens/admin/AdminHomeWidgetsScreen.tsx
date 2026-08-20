import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import GradientButton from '@/components/GradientButton';
import {
  useAdminTopProductsWidgetQuery,
  useAdminUpdateTopProductsWidgetMutation,
} from '@/store/services/adminHomeWidgetsApi';
import { useCategoriesQuery, useProductsQuery } from '@/store/services/productsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

const LINK_TYPES = ['NONE', 'PRODUCT', 'CATEGORY'] as const;

export default function AdminHomeWidgetsScreen({ navigation }: any) {
  const { data, error, isError, isLoading, refetch } = useAdminTopProductsWidgetQuery();
  const { data: productsRes } = useProductsQuery({ page: 1, limit: 100 });
  const { data: catsRes } = useCategoriesQuery({ page: 1, limit: 100 });
  const [updateWidget, updateState] = useAdminUpdateTopProductsWidgetMutation();
  const [title, setTitle] = useState('Top Products');
  const [linkType, setLinkType] = useState<(typeof LINK_TYPES)[number]>('NONE');
  const [linkId, setLinkId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [snack, setSnack] = useState('');

  const widget = data?.data || data;
  const products: any[] = productsRes?.data || [];
  const categories: any[] = catsRes?.data || [];

  useEffect(() => {
    if (!widget) return;
    setTitle(widget.title || 'Top Products');
    setLinkType((widget.linkType || 'NONE') as any);
    setLinkId(widget.linkId || '');
    setIsActive(widget.isActive ?? true);
  }, [widget]);

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load widget.'));
  }, [error, isError]);

  const onSave = async () => {
    if (!title.trim()) {
      setSnack('Title is required');
      return;
    }
    if (linkType !== 'NONE' && !linkId) {
      setSnack(`Select a ${linkType.toLowerCase()} for the redirect`);
      return;
    }
    try {
      await updateWidget({
        title: title.trim(),
        linkType,
        linkId: linkType === 'NONE' ? null : linkId,
        isActive,
      }).unwrap();
      setSnack('Widget saved');
      refetch();
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to save widget.'));
    }
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Home Widgets" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.label}>Title</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={C.textMuted}
          />
          <Text style={s.label}>Link type</Text>
          {LINK_TYPES.map((t) => (
            <GradientButton
              key={t}
              label={linkType === t ? `✓ ${t}` : t}
              variant={linkType === t ? 'accent' : 'secondary'}
              style={{ marginBottom: 6 }}
              onPress={() => {
                setLinkType(t);
                if (t === 'NONE') setLinkId('');
              }}
            />
          ))}
          {linkType === 'PRODUCT'
            ? products.slice(0, 20).map((p) => (
                <GradientButton
                  key={p.id}
                  label={linkId === p.id ? `✓ ${p.name}` : p.name}
                  variant={linkId === p.id ? 'accent' : 'secondary'}
                  style={{ marginBottom: 6 }}
                  onPress={() => setLinkId(p.id)}
                />
              ))
            : null}
          {linkType === 'CATEGORY'
            ? categories.map((c) => (
                <GradientButton
                  key={c.id}
                  label={linkId === c.id ? `✓ ${c.name}` : c.name}
                  variant={linkId === c.id ? 'accent' : 'secondary'}
                  style={{ marginBottom: 6 }}
                  onPress={() => setLinkId(c.id)}
                />
              ))
            : null}
          <View style={[s.row, { marginVertical: 12 }]}>
            <Text style={s.label}>Active</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>
          <GradientButton label="Save" loading={updateState.isLoading} onPress={onSave} />
        </ScrollView>
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
