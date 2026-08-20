import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import {
  useAdminActiveUsersQuery,
  useAdminMostOrderedQuery,
  useAdminMostViewedQuery,
  useAdminSearchKeywordsQuery,
} from '@/store/services/adminAnalyticsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

export default function AdminAnalyticsScreen({ navigation }: any) {
  const active = useAdminActiveUsersQuery();
  const viewed = useAdminMostViewedQuery(10);
  const ordered = useAdminMostOrderedQuery(10);
  const keywords = useAdminSearchKeywordsQuery();
  const [snack, setSnack] = useState('');

  useEffect(() => {
    const err = active.error || viewed.error || ordered.error || keywords.error;
    if (err) setSnack(getErrorMessage(err, 'Failed to load analytics.'));
  }, [active.error, viewed.error, ordered.error, keywords.error]);

  const refreshing =
    active.isFetching || viewed.isFetching || ordered.isFetching || keywords.isFetching;
  const loading = active.isLoading || viewed.isLoading || ordered.isLoading || keywords.isLoading;

  const refetchAll = () => {
    active.refetch();
    viewed.refetch();
    ordered.refetch();
    keywords.refetch();
  };

  const activeData = active.data?.data || active.data || [];
  const activeCount = active.data?.count ?? (Array.isArray(activeData) ? activeData.length : 0);
  const viewedList = viewed.data?.data || viewed.data || [];
  const orderedList = ordered.data?.data || ordered.data || [];
  const keywordList = keywords.data?.data || keywords.data || [];

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Analytics" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.ruby} />
      ) : (
        <ScrollView
          contentContainerStyle={s.padded}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} />}
        >
          <Text style={s.section}>Active users (24h)</Text>
          <View style={s.kpiGrid}>
            <View style={s.kpi}>
              <Text style={s.kpiValue}>{activeCount}</Text>
              <Text style={s.kpiLabel}>Active</Text>
            </View>
          </View>
          {(Array.isArray(activeData) ? activeData : []).slice(0, 20).map((u: any, i: number) => (
            <View key={u.userId || u.user?.id || i} style={s.card}>
              <Text style={s.title}>{u.user?.name || 'User'}</Text>
              <Text style={s.meta}>{u.user?.email || u.userId}</Text>
            </View>
          ))}

          <Text style={s.section}>Most viewed</Text>
          {(Array.isArray(viewedList) ? viewedList : []).map((p: any, i: number) => (
            <View key={p.id || i} style={s.card}>
              <Text style={s.title}>{p.name || p.productName || 'Product'}</Text>
              <Text style={s.meta}>Views: {p.views ?? p.viewCount ?? '-'}</Text>
            </View>
          ))}

          <Text style={s.section}>Most ordered</Text>
          {(Array.isArray(orderedList) ? orderedList : []).map((p: any, i: number) => (
            <View key={p.id || i} style={s.card}>
              <Text style={s.title}>{p.name || p.productName || 'Product'}</Text>
              <Text style={s.meta}>
                Ordered: {p.totalOrdered ?? p.orders ?? p.orderCount ?? p.quantity ?? 0}
              </Text>
            </View>
          ))}

          <Text style={s.section}>Search keywords</Text>
          {(Array.isArray(keywordList) ? keywordList : []).map((k: any, i: number) => (
            <View key={k.keyword || k.id || i} style={s.card}>
              <Text style={s.title}>{k.keyword || k.term || String(k)}</Text>
              <Text style={s.meta}>Count: {k.count ?? k.searches ?? '-'}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
