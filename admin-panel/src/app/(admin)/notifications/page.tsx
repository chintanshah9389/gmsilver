'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import { DataGrid, GridColDef } from '@mui/x-data-grid';
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

type HistoryRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string;
  recipientCount: number;
  createdAt: string;
};

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [delivery, setDelivery] = useState<DeliveryResult | null>(null);
  const [apiMessage, setApiMessage] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await notificationsApi.getHistory({ page: 1, limit: 50 });
      const payload = res.data?.data ?? res.data;
      setRows(payload?.notifications || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load notification history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const send = async () => {
    try {
      setLoading(true);
      setDelivery(null);
      setApiMessage('');
      const res = await notificationsApi.sendBroadcast(title, body, link.trim() || undefined);
      const payload = res.data;
      const result = (payload?.data ?? payload) as DeliveryResult;
      const message = payload?.message || 'Broadcast processed';

      setDelivery(result);
      setApiMessage(message);

      if (result?.successCount > 0 && result.failureCount === 0) {
        toast.success(message);
        setTitle('');
        setBody('');
        setLink('');
      } else if (result?.successCount > 0) {
        toast.success(message);
      } else {
        toast.error(message || 'Push was not delivered to any device');
      }

      await loadHistory();
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

  const columns: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Sent',
      width: 170,
      valueFormatter: (params) =>
        params.value ? new Date(String(params.value)).toLocaleString() : '',
    },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    { field: 'body', headerName: 'Body', flex: 1.4, minWidth: 220 },
    {
      field: 'link',
      headerName: 'Link',
      flex: 1,
      minWidth: 160,
      valueGetter: (params) => params.row.link || '—',
    },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'recipientCount', headerName: 'Recipients', width: 110 },
  ];

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
      }}>
        <Typography variant='h5' fontWeight={700}>Notifications</Typography>
        <Typography variant='body2' color='text.secondary'>
          Send broadcast notifications with optional deep links, and review history
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 900, mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label='Title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={4}
            label='Body'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label='Link (optional)'
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder='product:<productId>  or  order:<orderId>  or  https://...'
            helperText='Users tapping the notification open this destination. Examples: product:UUID · order:UUID · https://yoursite.com'
            sx={{ mb: 2 }}
          />
          <Button
            variant='contained'
            onClick={send}
            disabled={!title || !body || loading}
          >
            {loading ? 'Sending...' : 'Send Broadcast'}
          </Button>

          {delivery && (
            <Alert severity={severity} sx={{ mt: 3 }}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                {apiMessage}
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
                <Chip size='small' label={`Users: ${delivery.usersTargeted}`} />
                <Chip size='small' label={`Tokens: ${delivery.tokensTargeted}`} />
                <Chip size='small' color='success' label={`Sent: ${delivery.successCount}`} />
                <Chip
                  size='small'
                  color={delivery.failureCount ? 'error' : 'default'}
                  label={`Failed: ${delivery.failureCount}`}
                />
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

      <Card>
        <CardContent>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
            <Typography variant='h6' fontWeight={700}>Notification history</Typography>
            <Button size='small' onClick={() => void loadHistory()} disabled={historyLoading}>
              Refresh
            </Button>
          </Stack>
          <Box sx={{ height: 480 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={historyLoading}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
