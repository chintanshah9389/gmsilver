'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Chip,
  MenuItem,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Delete } from '@mui/icons-material';
import { categoriesApi, notificationsApi, productsApi } from '@/lib/api';
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  defaultAdminPaginationModel,
  toApiPage,
} from '@/lib/pagination';
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

type LinkType = 'NONE' | 'PRODUCT' | 'CATEGORY' | 'CUSTOM';

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'CUSTOM', label: 'Custom URL' },
];

function buildLink(linkType: LinkType, linkId: string, customUrl: string): string | undefined {
  if (linkType === 'PRODUCT' && linkId) return `product:${linkId}`;
  if (linkType === 'CATEGORY' && linkId) return `category:${linkId}`;
  if (linkType === 'CUSTOM') {
    const trimmed = customUrl.trim();
    return trimmed || undefined;
  }
  return undefined;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('NONE');
  const [linkId, setLinkId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryResult | null>(null);
  const [apiMessage, setApiMessage] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState(defaultAdminPaginationModel);

  const selectedProduct = products.find((product) => product.id === linkId) ?? null;
  const selectedCategory = categories.find((category) => category.id === linkId) ?? null;
  const resolvedLink = buildLink(linkType, linkId, customUrl);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await notificationsApi.getHistory(toApiPage(paginationModel));
      const payload = res.data?.data ?? res.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.notifications || [];
      setRows(list);
      setTotalRows(Number(res.data?.meta?.total || list.length || 0));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load notification history');
    } finally {
      setHistoryLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  const loadLinkOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll({ page: 1, limit: 100 }),
        categoriesApi.getAll({ page: 1, limit: 100 }),
      ]);
      setProducts(productsRes.data?.data || productsRes.data || []);
      setCategories(categoriesRes.data?.data || categoriesRes.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load products/categories');
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    void loadLinkOptions();
  }, [loadLinkOptions]);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setLinkType('NONE');
    setLinkId('');
    setCustomUrl('');
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this notification record?')) return;
    try {
      await notificationsApi.delete(id);
      toast.success('Notification deleted');
      setSelectedIds((prev) => prev.filter((selectedId) => String(selectedId) !== id));
      await loadHistory();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one notification');
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} selected notification(s)?`)) return;

    try {
      setBulkDeleting(true);
      const ids = selectedIds.map((id) => String(id));
      const res = await notificationsApi.bulkDelete(ids);
      const result = res.data?.data || res.data;
      const deletedCount = Number(result?.deletedCount || 0);
      const failedCount = Number(result?.failedCount || 0);

      if (deletedCount > 0) {
        toast.success(`${deletedCount} notification(s) deleted`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} notification(s) could not be deleted`);
      }
      if (deletedCount === 0 && failedCount === 0) {
        toast('No notifications were deleted');
      }

      setSelectedIds([]);
      await loadHistory();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const send = async () => {
    if (linkType === 'PRODUCT' && !linkId) {
      toast.error('Select a product for the deep link');
      return;
    }
    if (linkType === 'CATEGORY' && !linkId) {
      toast.error('Select a category for the deep link');
      return;
    }
    if (linkType === 'CUSTOM' && !customUrl.trim()) {
      toast.error('Enter a custom URL for the deep link');
      return;
    }

    try {
      setLoading(true);
      setDelivery(null);
      setApiMessage('');
      const res = await notificationsApi.sendBroadcast(title, body, resolvedLink);
      const payload = res.data;
      const result = (payload?.data ?? payload) as DeliveryResult;
      const message = payload?.message || 'Broadcast processed';

      setDelivery(result);
      setApiMessage(message);

      if (result?.successCount > 0 && result.failureCount === 0) {
        toast.success(message);
        resetForm();
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
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size='small'
          color='error'
          title='Delete'
          onClick={(e) => {
            e.stopPropagation();
            void onDelete(params.row.id);
          }}
        >
          <Delete fontSize='small' />
        </IconButton>
      ),
    },
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
            select
            fullWidth
            label='Link (optional)'
            value={linkType}
            onChange={(e) => {
              setLinkType(e.target.value as LinkType);
              setLinkId('');
              setCustomUrl('');
            }}
            helperText='Choose where users go when they tap the notification'
            sx={{ mb: 2 }}
          >
            {LINK_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </TextField>

          {linkType === 'PRODUCT' ? (
            <Autocomplete
              options={products}
              value={selectedProduct}
              onChange={(_, value) => setLinkId(value?.id || '')}
              getOptionLabel={(option) => `${option.name}${option.sku ? ` (${option.sku})` : ''}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={optionsLoading}
              sx={{ mb: 2 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Select product'
                  helperText={
                    resolvedLink
                      ? `Deep link: ${resolvedLink}`
                      : 'Search and choose which product opens on tap'
                  }
                />
              )}
            />
          ) : null}

          {linkType === 'CATEGORY' ? (
            <Autocomplete
              options={categories}
              value={selectedCategory}
              onChange={(_, value) => setLinkId(value?.id || '')}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={optionsLoading}
              sx={{ mb: 2 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Select category'
                  helperText={
                    resolvedLink
                      ? `Deep link: ${resolvedLink}`
                      : 'Search and choose which category product list opens on tap'
                  }
                />
              )}
            />
          ) : null}

          {linkType === 'CUSTOM' ? (
            <TextField
              fullWidth
              label='Custom URL'
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder='https://...'
              helperText='Users tapping the notification open this URL'
              sx={{ mb: 2 }}
            />
          ) : null}

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
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }} flexWrap='wrap' useFlexGap spacing={1}>
            <Typography variant='h6' fontWeight={700}>Notification history</Typography>
            <Stack direction='row' spacing={1}>
              <Button
                size='small'
                variant='outlined'
                color='error'
                startIcon={<Delete />}
                disabled={selectedIds.length === 0 || bulkDeleting}
                onClick={() => void onDeleteSelected()}
              >
                {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
              </Button>
              <Button size='small' onClick={() => void loadHistory()} disabled={historyLoading}>
                Refresh
              </Button>
            </Stack>
          </Stack>
          <Box sx={{ height: 480 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={historyLoading}
              getRowId={(r) => r.id}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(newSelection) => setSelectedIds(newSelection)}
              paginationMode='server'
              rowCount={totalRows}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[...ADMIN_PAGE_SIZE_OPTIONS]}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
