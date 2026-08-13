import React, { useEffect, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, View, StatusBar } from 'react-native';
import { Icon, Snackbar } from 'react-native-paper';
import { useInvoicesQuery } from '@/store/services/ordersApi';
import { getErrorMessage } from '@/lib/error-message';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import MotionReveal from '@/components/MotionReveal';
import { C } from '@/theme/colors';
import { E } from '@/theme/effects';

export default function InvoicesScreen({ navigation }: any) {
  const { data, error, isError } = useInvoicesQuery();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const invoices = data?.data || [];

  useEffect(() => {
    if (isError && error) {
      setSnackbarMessage(getErrorMessage(error, 'Failed to load invoices.'));
      setSnackbarVisible(true);
    }
  }, [error, isError]);

  const openPdf = async (url?: string) => {
    if (!url) {
      setSnackbarMessage('Invoice PDF is not available yet.');
      setSnackbarVisible(true);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setSnackbarMessage('Could not open this invoice.');
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScreenHeader
        title="My Invoices"
        subtitle={`${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'}`}
        onBack={navigation.canGoBack?.() ? () => navigation.goBack() : undefined}
      />
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotionReveal delay={Math.min(index * 28, 220)} duration={250} distance={10}>
            <View style={s.card}>
              <View style={s.cardCopy}>
                <Text style={s.title}>{item.invoiceNumber}</Text>
                <Text style={s.sub}>{item.order?.orderNumber || 'Invoice'}</Text>
              </View>
              <ScalePressable style={s.openBtn} scaleTo={0.97} onPress={() => openPdf(item.pdfUrl)}>
                <Icon source="file-pdf-box" size={16} color={C.text} />
                <Text style={s.openText}>Open PDF</Text>
              </ScalePressable>
            </View>
          </MotionReveal>
        )}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIconBox}>
              <Icon source="file-document-outline" size={28} color={C.textMuted} />
            </View>
            <Text style={s.emptyText}>No invoices yet</Text>
            <Text style={s.emptySub}>Invoices appear after an order is completed</Text>
          </View>
        }
      />
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={4000}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...E.softShadow,
  },
  cardCopy: { flex: 1, minWidth: 0 },
  title: { color: C.text, fontSize: 14, fontWeight: '800' },
  sub: { color: C.textSub, fontSize: 12, marginTop: 3 },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface2,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  openText: { color: C.text, fontSize: 12, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(184,149,108,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText: { color: C.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: C.textMuted, fontSize: 13, textAlign: 'center' },
});
