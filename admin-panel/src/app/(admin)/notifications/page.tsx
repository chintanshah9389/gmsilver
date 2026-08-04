'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

type DeliveryResult = {
  firebaseReady: boolean;
  usersTargeted: number;
  tokensTargeted: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  skippedReason?: string;
};

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryResult | null>(null);
  const [apiMessage, setApiMessage] = useState('');

  const send = async () => {
    try {
      setLoading(true);
      setDelivery(null);
      setApiMessage('');
      const res = await notificationsApi.sendBroadcast(title, body);
      const payload = res.data;
      const result = (payload?.data ?? payload) as DeliveryResult;
      const message = payload?.message || 'Broadcast processed';

      setDelivery(result);
      setApiMessage(message);

      if (result?.successCount > 0 && result.failureCount === 0) {
        toast.success(message);
        setTitle('');
        setBody('');
      } else if (result?.successCount > 0) {
        toast.success(message);
      } else {
        toast.error(message || 'Push was not delivered to any device');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  const severity =
    !delivery
      ? 'info'
      : delivery.successCount > 0 && delivery.failureCount === 0
        ? 'success'
        : delivery.successCount > 0
          ? 'warning'
          : 'error';

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
      }}>
        <Typography variant='h5' fontWeight={700}>Notifications</Typography>
        <Typography variant='body2' color='text.secondary'>Send broadcast notifications to all active users</Typography>
      </Box>
      <Card sx={{ maxWidth: 760 }}>
        <CardContent>
          <TextField fullWidth label='Title' value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth multiline minRows={4} label='Body' value={body} onChange={(e) => setBody(e.target.value)} sx={{ mb: 2 }} />
          <Button variant='contained' onClick={send} disabled={!title || !body || loading}>{loading ? 'Sending...' : 'Send Broadcast'}</Button>

          {delivery && (
            <Alert severity={severity} sx={{ mt: 3 }}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                {apiMessage}
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
                <Chip size='small' label={`Users: ${delivery.usersTargeted}`} />
                <Chip size='small' label={`Tokens: ${delivery.tokensTargeted}`} />
                <Chip size='small' color='success' label={`Sent: ${delivery.successCount}`} />
                <Chip size='small' color={delivery.failureCount ? 'error' : 'default'} label={`Failed: ${delivery.failureCount}`} />
                <Chip
                  size='small'
                  color={delivery.firebaseReady ? 'success' : 'error'}
                  label={delivery.firebaseReady ? 'Firebase ready' : 'Firebase not ready'}
                />
              </Stack>
              {delivery.skippedReason && (
                <Typography variant='body2' sx={{ mb: 1 }}>
                  Skipped: {delivery.skippedReason}
                </Typography>
              )}
              {delivery.errors?.length > 0 && (
                <Box component='ul' sx={{ m: 0, pl: 2 }}>
                  {delivery.errors.map((err) => (
                    <li key={err}>
                      <Typography variant='caption' component='span'>{err}</Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
