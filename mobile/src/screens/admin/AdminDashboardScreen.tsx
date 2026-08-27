import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import { useAdminDashboardQuery } from '@/store/services/adminAnalyticsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

export default function AdminDashboardScreen({ navigation }: any) {
  const { data, error, isError, isFetching, refetch, isLoading } = useAdminDashboardQuery();
  const [snack, setSnack] = useState('');
  const d = data?.data || data || {};

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load dashboard.'));
  }, [error, isError]);

  const kpis = [
    { label: 'Users', value: d.users?.total ?? d.totalUsers ?? 0 },
    { label: 'Pending users', value: d.users?.pending ?? 0 },
    { label: 'Products', value: d.products?.total ?? d.totalProducts ?? 0 },
    { label: 'Categories', value: d.categories ?? d.totalCategories ?? 0 },
    { label: 'Orders', value: d.orders?.total ?? d.totalOrders ?? 0 },
    { label: 'Pending orders', value: d.orders?.pending ?? d.pendingOrders ?? 0 },
  ];

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Dashboard" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <ScrollView
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        >
          <View style={s.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={s.kpi}>
                <Text style={s.kpiValue}>{k.value}</Text>
                <Text style={s.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
