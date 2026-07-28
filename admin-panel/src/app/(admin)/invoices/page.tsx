'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Link as MuiLink, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ordersApi } from '@/lib/api';

export default function InvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await ordersApi.getAll({ page: 1, limit: 200 });
      const invoiceRows = res.data.data.filter((o: any) => o.invoice);
      setRows(invoiceRows);
      setLoading(false);
    })();
  }, []);

  const columns: GridColDef[] = [
    { field: 'orderNumber', headerName: 'Order No', width: 170 },
    { field: 'invoiceNumber', headerName: 'Invoice No', width: 170, valueGetter: (p) => p.row.invoice?.invoiceNumber || '-' },
    { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 180, valueGetter: (p) => p.row.user?.name || '-' },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip size='small' label={p.value} color='success' /> },
    { field: 'total', headerName: 'Total', width: 130, valueGetter: (p) => `₹${Number(p.row.grandTotal).toLocaleString()}` },
    {
      field: 'pdf',
      headerName: 'PDF',
      width: 120,
      renderCell: (p) => p.row.invoice?.pdfUrl ? (
        <MuiLink href={p.row.invoice.pdfUrl} target='_blank' rel='noreferrer'>Open</MuiLink>
      ) : '-',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' fontWeight={700}>Invoices</Typography>
        <Typography variant='body2' color='text.secondary'>Invoice records and PDF links</Typography>
      </Box>
      <Card><CardContent><Box sx={{ height: 640 }}><DataGrid rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} /></Box></CardContent></Card>
    </Box>
  );
}
