import React, { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import GradientButton from '@/components/GradientButton';
import {
  useAdminExportOrdersMutation,
  useAdminExportProductsMutation,
  useAdminExportUsersMutation,
  useAdminImportProductsMutation,
} from '@/store/services/adminExcelApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

async function shareExport(base64: string, filename: string) {
  if (Platform.OS === 'web') {
    const g = globalThis as any;
    const doc = g.document;
    if (doc?.createElement) {
      const link = doc.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
      link.download = filename;
      link.click();
      return;
    }
    throw new Error('Web download unavailable');
  }

  // Native-only modules — never import at top level (breaks Expo web / TurboModules).
  const FileSystem = await import('expo-file-system');
  const Share = (await import('react-native-share')).default;
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Share.open({
    url: `file://${path}`,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename,
  });
}

async function pickExcelFile() {
  const DocumentPicker = await import('expo-document-picker');
  return DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '*/*',
    ],
    copyToCacheDirectory: true,
  });
}

export default function AdminExcelScreen({ navigation }: any) {
  const [exportProducts, productsState] = useAdminExportProductsMutation();
  const [exportUsers, usersState] = useAdminExportUsersMutation();
  const [exportOrders, ordersState] = useAdminExportOrdersMutation();
  const [importProducts, importState] = useAdminImportProductsMutation();
  const [snack, setSnack] = useState('');

  const runExport = async (
    fn: () => Promise<{ base64: string }>,
    filename: string,
  ) => {
    try {
      const res = await fn();
      await shareExport(res.base64, filename);
      setSnack('Export ready');
    } catch (e: any) {
      if (e?.message === 'User did not share') return;
      setSnack(getErrorMessage(e, 'Export failed.'));
    }
  };

  const onImport = async () => {
    try {
      const picked = await pickExcelFile();
      if (picked.canceled || !picked.assets?.[0]) return;
      const file = picked.assets[0];
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name || 'products.xlsx',
        type:
          file.mimeType ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as any);
      await importProducts(form).unwrap();
      setSnack('Products imported');
    } catch (e) {
      setSnack(getErrorMessage(e, 'Import failed.'));
    }
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Import / Export" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.padded}>
        <Text style={s.section}>Export</Text>
        <GradientButton
          label="Export products"
          loading={productsState.isLoading}
          style={{ marginBottom: 8 }}
          onPress={() =>
            runExport(
              async () => (await exportProducts().unwrap()) as any,
              `products-${Date.now()}.xlsx`,
            )
          }
        />
        <GradientButton
          label="Export users"
          loading={usersState.isLoading}
          style={{ marginBottom: 8 }}
          onPress={() =>
            runExport(
              async () => (await exportUsers().unwrap()) as any,
              `users-${Date.now()}.xlsx`,
            )
          }
        />
        <GradientButton
          label="Export orders"
          loading={ordersState.isLoading}
          style={{ marginBottom: 8 }}
          onPress={() =>
            runExport(
              async () => (await exportOrders().unwrap()) as any,
              `orders-${Date.now()}.xlsx`,
            )
          }
        />

        <Text style={s.section}>Import</Text>
        <Text style={[s.meta, { marginBottom: 10, color: C.textSub }]}>
          Upload an Excel file to import products.
        </Text>
        <GradientButton
          label="Import products"
          loading={importState.isLoading}
          variant="accent"
          onPress={onImport}
        />
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
