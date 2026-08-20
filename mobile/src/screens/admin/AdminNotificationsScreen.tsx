import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import PremiumBackground from '@/components/PremiumBackground';
import ScreenHeader from '@/components/ScreenHeader';
import ScalePressable from '@/components/ScalePressable';
import GradientButton from '@/components/GradientButton';
import {
  useAdminDeleteNotificationMutation,
  useAdminNotificationHistoryQuery,
  useAdminSendBroadcastMutation,
} from '@/store/services/adminNotificationsApi';
import { getErrorMessage } from '@/lib/error-message';
import { C } from '@/theme/colors';
import { adminStyles as s } from './adminStyles';

export default function AdminNotificationsScreen({ navigation }: any) {
  const { data, error, isError, isFetching, refetch, isLoading } =
    useAdminNotificationHistoryQuery({ page: 1, limit: 50 });
  const [sendBroadcast, sendState] = useAdminSendBroadcastMutation();
  const [deleteNotif] = useAdminDeleteNotificationMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (isError && error) setSnack(getErrorMessage(error, 'Failed to load history.'));
  }, [error, isError]);

  const history: any[] = data?.data || [];

  const onSend = async () => {
    if (!title.trim() || !body.trim()) {
      setSnack('Title and body are required.');
      return;
    }
    try {
      await sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || undefined,
      }).unwrap();
      setTitle('');
      setBody('');
      setLink('');
      setSnack('Broadcast sent');
    } catch (e) {
      setSnack(getErrorMessage(e, 'Failed to send broadcast.'));
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this notification history item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNotif(id).unwrap();
            setSnack('Deleted');
          } catch (e) {
            setSnack(getErrorMessage(e, 'Failed to delete.'));
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <PremiumBackground />
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.padded}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={s.section}>Send broadcast</Text>
            <TextInput
              style={s.input}
              placeholder="Title"
              placeholderTextColor={C.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Body"
              placeholderTextColor={C.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
            />
            <TextInput
              style={s.input}
              placeholder="Optional link"
              placeholderTextColor={C.textMuted}
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
            />
            <GradientButton label="Send" loading={sendState.isLoading} onPress={onSend} />
            <Text style={[s.section, { marginTop: 20 }]}>History</Text>
            {isLoading ? <ActivityIndicator color={C.ruby} /> : null}
          </View>
        }
        ListEmptyComponent={!isLoading ? <Text style={s.empty}>No history</Text> : null}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.meta}>{item.body}</Text>
            <View style={s.actions}>
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
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </View>
  );
}
