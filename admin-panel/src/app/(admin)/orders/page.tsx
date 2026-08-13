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
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { CheckCircle, Cancel, Description, Delete } from '@mui/icons-material';
import { ordersApi, invoicesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersApi.getAll({ page: 1, limit: 200 });
      setRows(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      toast.success(`Order ${status.toLowerCase()}`);
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Status update failed');
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
      await fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'orderNumber', headerName: 'Order No', width: 180 },
    { field: 'user', headerName: 'Customer', flex: 1, minWidth: 180, valueGetter: (p) => p.row.user?.name || '-' },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip size='small' label={p.value} color={p.value === 'PENDING' ? 'warning' : p.value === 'APPROVED' ? 'info' : p.value === 'COMPLETED' ? 'success' : p.value === 'REJECTED' ? 'error' : 'default'} /> },
    { field: 'grandTotal', headerName: 'Total', width: 130, valueGetter: (p) => `₹${Number(p.row.grandTotal).toLocaleString()}` },
    { field: 'createdAt', headerName: 'Date', width: 130, valueGetter: (p) => new Date(p.row.createdAt).toLocaleDateString('en-IN') },
    {
      field: 'actions', headerName: 'Actions', width: 280, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display:'flex', gap:1 }}>
          {p.row.status === 'PENDING' && (
            <>
              <IconButton color='success' size='small' onClick={(e) => { e.stopPropagation(); updateStatus(p.row.id, 'APPROVED'); }}><CheckCircle fontSize='small' /></IconButton>
              <IconButton color='error' size='small' onClick={(e) => { e.stopPropagation(); updateStatus(p.row.id, 'REJECTED'); }}><Cancel fontSize='small' /></IconButton>
            </>
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

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Orders</Typography>
          <Typography variant='body2' color='text.secondary'>Approve, reject, complete, and invoice orders</Typography>
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
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
