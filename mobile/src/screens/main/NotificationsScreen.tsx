import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, StatusBar } from 'react-native';
import { Snackbar } from 'react-native-paper';
import {
  useNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from '@/store/services/notificationsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import PremiumBackground from '@/components/PremiumBackground';
import { E } from '@/theme/effects';
import MotionReveal from '@/components/MotionReveal';
import ScalePressable from '@/components/ScalePressable';
import {
  navigateFromPushData,
  PushNavigationData,
} from '@/navigation/navigationRef';

export default function NotificationsScreen() {
  const { data, error, isError } = useNotificationsQuery({ page: 1, limit: 100 });
  const [markAllRead] = useMarkAllReadMutation();
  const [markRead] = useMarkReadMutation();
  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const rows: any[] = data?.notifications || data?.data || [];

  useEffect(() => {
    if (isError && error) {
      setSnackMsg(getErrorMessage(error, 'Failed.'));
      setSnackVisible(true);
    }
  }, [error, isError]);

  const openNotification = async (item: any) => {
    if (!item.isRead) {
      try {
        await markRead(item.id).unwrap();
      } catch {
        // still allow navigation
      }
    }

    const raw = item.notification?.data || item.data || {};
    const pushData: PushNavigationData = {
      link: typeof raw.link === 'string' ? raw.link : undefined,
      productId: typeof raw.productId === 'string' ? raw.productId : undefined,
      orderId: typeof raw.orderId === 'string' ? raw.orderId : undefined,
      type: typeof raw.type === 'string' ? raw.type : item.notification?.type,
    };
    navigateFromPushData(pushData);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <MotionReveal delay={30} duration={420} distance={18}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Notifications</Text>
          <ScalePressable style={s.markBtn} scaleTo={0.97} onPress={() => markAllRead()}>
            <Text style={s.markBtnText}>Mark all read</Text>
          </ScalePressable>
        </View>
      </MotionReveal>
      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const title = item.notification?.title || item.title;
          const body = item.notification?.body || item.body;
          const link = item.notification?.data?.link || item.data?.link;
          const isRead = item.isRead;
          return (
            <MotionReveal delay={Math.min(index * 26, 220)} duration={240} distance={9}>
              <ScalePressable scaleTo={0.98} onPress={() => openNotification(item)}>
                <View style={[s.card, !isRead && s.cardUnread]}>
                  {!isRead && <View style={s.unreadDot} />}
                  <View style={{ flex: 1 }}>
                    <Text style={s.notifTitle}>{title}</Text>
                    {body ? <Text style={s.notifBody} numberOfLines={3}>{body}</Text> : null}
                    {link ? (
                      <Text style={s.notifLink} numberOfLines={1}>
                        Open: {String(link)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </ScalePressable>
            </MotionReveal>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>*</Text>
            <Text style={s.emptyText}>No notifications</Text>
          </View>
        }
      />
      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={4000}>{snackMsg}</Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  markBtn: { backgroundColor: C.surface2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border, ...E.softShadow },
  markBtnText: { color: C.silver, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', gap: 10, ...E.softShadow },
  cardUnread: { borderColor: 'rgba(192,192,192,0.3)', backgroundColor: C.surface2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.silver, marginTop: 5 },
  notifTitle: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  notifBody: { color: C.textSub, fontSize: 13, lineHeight: 18 },
  notifLink: { color: C.silver, fontSize: 11, marginTop: 8, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { color: C.textMuted, fontSize: 28 },
  emptyText: { color: C.textSub, fontSize: 14 },
});
