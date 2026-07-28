'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { excelApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ExcelPage() {
  const [importing, setImporting] = useState(false);

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportProducts = async () => {
    const res = await excelApi.exportProducts();
    downloadBlob(new Blob([res.data]), `products-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportUsers = async () => {
    const res = await excelApi.exportUsers();
    downloadBlob(new Blob([res.data]), `users-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportOrders = async () => {
    const res = await excelApi.exportOrders();
    downloadBlob(new Blob([res.data]), `orders-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const importProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const res = await excelApi.importProducts(file);
      toast.success(res.data.message || 'Import complete');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' fontWeight={700}>Excel Import/Export</Typography>
        <Typography variant='body2' color='text.secondary'>Bulk data operations for products, users, and orders</Typography>
      </Box>
      <Card sx={{ maxWidth: 640 }}>
        <CardContent>
          <Stack spacing={2}>
            <Button variant='outlined' onClick={exportProducts}>Export Products</Button>
            <Button variant='outlined' onClick={exportUsers}>Export Users</Button>
            <Button variant='outlined' onClick={exportOrders}>Export Orders</Button>
            <Button variant='contained' component='label' disabled={importing}>
              {importing ? 'Importing...' : 'Import Products (Excel)'}
              <input type='file' hidden accept='.xlsx,.xls' onChange={importProducts} />
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
