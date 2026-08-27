'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import {
  CheckCircle,
  Cancel,
  Description,
  Delete,
  DoneAll,
  Visibility,
} from '@mui/icons-material';
import { ordersApi, invoicesApi } from '@/lib/api';
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  defaultAdminPaginationModel,
  toApiPage,
} from '@/lib/pagination';
import toast from 'react-hot-toast';

function itemSummary(items: any[] = []) {
  if (!items.length) return '—';
  return items
    .map((item) => `${item.quantity}× ${item.product?.name || 'Item'}`)
    .join(', ');
}

function statusColor(status: string) {
  if (status === 'PENDING') return 'warning';
  if (status === 'APPROVED') return 'info';
  if (status === 'COMPLETED') return 'success';
  if (status === 'REJECTED') return 'error';
  return 'default';
}

export default function OrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState(defaultAdminPaginationModel);

  const fetchOrders = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const res = await ordersApi.getAll({
        ...toApiPage(paginationModel),
        _t: Date.now(),
      });
      const nextRows = res.data.data || [];
      setRows(nextRows);
      setTotalRows(Number(res.data.meta?.total || 0));
      setSelectedOrder((current: any | null) => {
        if (!current) return current;
        const fresh = nextRows.find((row: any) => row.id === current.id);
        return fresh || { ...current };
      });
    } catch (e: any) {
      if (!opts?.silent) {
        toast.error(e.response?.data?.message || 'Failed to fetch orders');
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [paginationModel.page, paginationModel.pageSize]);

  // Keep status current while the orders page stays open (e.g. another admin updates).
  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchOrders({ silent: true });
    }, 10000);
    return () => window.clearInterval(id);
  }, [paginationModel.page, paginationModel.pageSize]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await ordersApi.updateStatus(id, status);
      const result = res.data?.data || res.data;
      const push = result?.push;
      const label = status.toLowerCase();
      const nextStatus = result?.status || status;

      // Update UI immediately so the grid/dialog don't keep the old status.
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: nextStatus } : row)),
      );
      setSelectedOrder((current) =>
        current?.id === id ? { ...current, status: nextStatus } : current,
      );

      if (push?.successCount > 0) {
        toast.success(`Order ${label}. Customer notified.`);
      } else if (push?.skippedReason || push?.failureCount > 0) {
        toast.success(`Order ${label}`);
        toast.error(
          `Push not sent: ${push.skippedReason || push.errors?.[0] || 'delivery failed'}`,
        );
      } else {
        toast.success(`Order ${label}`);
      }

      await fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Status update failed');
      await fetchOrders();
    }
  };

  const generateInvoice = async (orderId: string) => {
    try {
      await invoicesApi.generateInvoice(orderId);
      toast.success('Invoice generated');
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Invoice generation failed');
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    try {
      await ordersApi.delete(id);
      toast.success('Order deleted');
      setSelectedIds((prev) => prev.filter((selectedId) => String(selectedId) !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
      await fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one order');
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} selected order(s)?`)) return;

    try {
      setBulkDeleting(true);
      const ids = selectedIds.map((id) => String(id));
      const res = await ordersApi.bulkDelete(ids);
      const result = res.data?.data || res.data;
      const deletedCount = Number(result?.deletedCount || 0);
      const failedCount = Number(result?.failedCount || 0);

      if (deletedCount > 0) {
        toast.success(`${deletedCount} order(s) deleted`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} order(s) could not be deleted`);
      }
      if (deletedCount === 0 && failedCount === 0) {
        toast('No orders were deleted');
      }

      setSelectedIds([]);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const openDetails = (row: any) => setSelectedOrder(row);

  const columns: GridColDef[] = [
    { field: 'orderNumber', headerName: 'Order No', width: 170 },
    { field: 'user', headerName: 'Customer', width: 160, valueGetter: (p) => p.row.user?.name || '-' },
    {
      field: 'items',
      headerName: 'Requested items',
      flex: 1.4,
      minWidth: 240,
      sortable: false,
      renderCell: (p) => (
        <Typography variant='body2' noWrap title={itemSummary(p.row.items)}>
          {itemSummary(p.row.items)}
        </Typography>
      ),
    },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (p) => <Chip size='small' label={p.value} color={statusColor(p.value)} /> },
    { field: 'createdAt', headerName: 'Date', width: 120, valueGetter: (p) => new Date(p.row.createdAt).toLocaleDateString('en-IN') },
    {
      field: 'actions', headerName: 'Actions', width: 280, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display:'flex', gap:0.5 }}>
          <IconButton size='small' title='View request' onClick={(e) => { e.stopPropagation(); openDetails(p.row); }}>
            <Visibility fontSize='small' />
          </IconButton>
          {p.row.status === 'PENDING' && (
            <>
              <IconButton color='success' size='small' title='Approve' onClick={(e) => { e.stopPropagation(); updateStatus(p.row.id, 'APPROVED'); }}><CheckCircle fontSize='small' /></IconButton>
              <IconButton color='error' size='small' title='Reject' onClick={(e) => { e.stopPropagation(); updateStatus(p.row.id, 'REJECTED'); }}><Cancel fontSize='small' /></IconButton>
            </>
          )}
          {p.row.status === 'APPROVED' && (
            <IconButton color='success' size='small' title='Complete' onClick={(e) => { e.stopPropagation(); updateStatus(p.row.id, 'COMPLETED'); }}>
              <DoneAll fontSize='small' />
            </IconButton>
          )}
          {(p.row.status === 'APPROVED' || p.row.status === 'COMPLETED') && (
            <Button size='small' startIcon={<Description />} onClick={(e) => { e.stopPropagation(); generateInvoice(p.row.id); }}>
              Invoice
            </Button>
          )}
          <IconButton
            size='small'
            color='error'
            title='Delete'
            onClick={(e) => {
              e.stopPropagation();
              void onDelete(p.row.id);
            }}
          >
            <Delete fontSize='small' />
          </IconButton>
        </Box>
      )
    }
  ];

  const items: any[] = selectedOrder?.items || [];

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Orders</Typography>
          <Typography variant='body2' color='text.secondary'>Review requested items, then approve, reject, complete, or invoice</Typography>
        </Box>
        <Button
          variant='outlined'
          color='error'
          startIcon={<Delete />}
          disabled={selectedIds.length === 0 || bulkDeleting}
          onClick={() => void onDeleteSelected()}
          sx={{ borderRadius: 2 }}
        >
          {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
        </Button>
      </Box>
      <Card>
        <CardContent>
          <Box sx={{ height: 640 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              getRowId={(r) => r.id}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(newSelection) => setSelectedIds(newSelection)}
              onRowDoubleClick={(params) => openDetails(params.row)}
              paginationMode='server'
              rowCount={totalRows}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[...ADMIN_PAGE_SIZE_OPTIONS]}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        fullWidth
        maxWidth='md'
        PaperProps={{
          sx: {
            background: '#12121A',
            border: '1px solid rgba(192,192,192,0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant='h6' fontWeight={700}>{selectedOrder?.orderNumber}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {selectedOrder?.createdAt
                ? new Date(selectedOrder.createdAt).toLocaleString('en-IN')
                : ''}
            </Typography>
          </Box>
          {selectedOrder ? (
            <Chip size='small' label={selectedOrder.status} color={statusColor(selectedOrder.status)} />
          ) : null}
        </DialogTitle>
        <DialogContent>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 0.5 }}>Customer</Typography>
          <Typography fontWeight={600}>{selectedOrder?.user?.name || '-'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {[selectedOrder?.user?.email, selectedOrder?.user?.phone].filter(Boolean).join(' · ') || 'No contact details'}
          </Typography>

          {selectedOrder?.notes ? (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, background: 'rgba(192,192,192,0.06)' }}>
              <Typography variant='subtitle2' color='text.secondary'>Customer notes</Typography>
              <Typography variant='body2'>{selectedOrder.notes}</Typography>
            </Box>
          ) : null}

          <Typography variant='subtitle2' color='text.secondary' sx={{ mt: 3, mb: 1 }}>
            Requested items
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => {
              const image = item.product?.imageUrl || item.product?.image1Url;
              const meta = [
                item.product?.sku,
                item.product?.purity,
                item.product?.weight ? `${item.product.weight}g` : null,
              ].filter(Boolean).join(' · ');

              return (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(192,192,192,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <Avatar
                    variant='rounded'
                    src={image || undefined}
                    alt={item.product?.name || 'Item'}
                    sx={{ width: 56, height: 56, bgcolor: '#1E1E2E' }}
                  >
                    {(item.product?.name || '?')[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>{item.product?.name || 'Item'}</Typography>
                    {meta ? (
                      <Typography variant='caption' color='text.secondary'>{meta}</Typography>
                    ) : null}
                    <Typography variant='body2' color='text.secondary'>
                      Qty {item.quantity}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            {items.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>No items on this order.</Typography>
            ) : null}
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(192,192,192,0.08)' }} />
          {selectedOrder?.notes ? (
            <Typography variant='body2' color='text.secondary'>Notes: {selectedOrder.notes}</Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
          {selectedOrder?.status === 'PENDING' && (
            <>
              <Button
                color='error'
                variant='outlined'
                startIcon={<Cancel />}
                onClick={() => void updateStatus(selectedOrder.id, 'REJECTED')}
              >
                Reject
              </Button>
              <Button
                color='success'
                variant='contained'
                startIcon={<CheckCircle />}
                onClick={() => void updateStatus(selectedOrder.id, 'APPROVED')}
              >
                Approve
              </Button>
            </>
          )}
          {selectedOrder?.status === 'APPROVED' && (
            <Button
              color='success'
              variant='contained'
              startIcon={<DoneAll />}
              onClick={() => void updateStatus(selectedOrder.id, 'COMPLETED')}
            >
              Complete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
