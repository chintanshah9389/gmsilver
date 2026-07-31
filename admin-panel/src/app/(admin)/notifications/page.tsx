'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button } from '@mui/material';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    try {
      setLoading(true);
      await notificationsApi.sendBroadcast(title, body);
      toast.success('Broadcast sent successfully');
      setTitle('');
      setBody('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

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
        </CardContent>
      </Card>
    </Box>
  );
}
