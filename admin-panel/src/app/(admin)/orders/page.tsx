'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, IconButton } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CheckCircle, Cancel, Description } from '@mui/icons-material';
import { ordersApi, invoicesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const columns: GridColDef[] = [
    { field: 'orderNumber', headerName: 'Order No', width: 180 },
    { field: 'user', headerName: 'Customer', flex: 1, minWidth: 180, valueGetter: (p) => p.row.user?.name || '-' },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip size='small' label={p.value} color={p.value === 'PENDING' ? 'warning' : p.value === 'APPROVED' ? 'info' : p.value === 'COMPLETED' ? 'success' : p.value === 'REJECTED' ? 'error' : 'default'} /> },
    { field: 'grandTotal', headerName: 'Total', width: 130, valueGetter: (p) => `₹${Number(p.row.grandTotal).toLocaleString()}` },
    { field: 'createdAt', headerName: 'Date', width: 130, valueGetter: (p) => new Date(p.row.createdAt).toLocaleDateString('en-IN') },
    {
      field: 'actions', headerName: 'Actions', width: 260, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display:'flex', gap:1 }}>
          {p.row.status === 'PENDING' && (
            <>
              <IconButton color='success' size='small' onClick={() => updateStatus(p.row.id, 'APPROVED')}><CheckCircle fontSize='small' /></IconButton>
              <IconButton color='error' size='small' onClick={() => updateStatus(p.row.id, 'REJECTED')}><Cancel fontSize='small' /></IconButton>
            </>
          )}
          {(p.row.status === 'APPROVED' || p.row.status === 'COMPLETED') && (
            <Button size='small' startIcon={<Description />} onClick={() => generateInvoice(p.row.id)}>
              Invoice
            </Button>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' fontWeight={700}>Orders</Typography>
        <Typography variant='body2' color='text.secondary'>Approve, reject, complete, and invoice orders</Typography>
      </Box>
      <Card>
        <CardContent>
          <Box sx={{ height: 640 }}>
            <DataGrid rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
