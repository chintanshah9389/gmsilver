'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, Delete, Edit } from '@mui/icons-material';
import { productsApi, categoriesApi, excelApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    name: '', description: '', price: '', weight: '', purity: '', sku: '', categoryId: '', isAvailable: 'true', isActive: 'true'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAll({ page: 1, limit: 200, search: search || undefined }),
        categoriesApi.getAll({ page: 1, limit: 200 }),
      ]);
      setRows(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', weight: '', purity: '', sku: '', categoryId: '', isAvailable: 'true', isActive: 'true' });
  };

  const onSave = async () => {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, String(v)); });
      if (editing) {
        await productsApi.update(editing.id, fd);
        toast.success('Product updated');
      } else {
        await productsApi.create(fd);
        toast.success('Product created');
      }
      setOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Product deleted');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const onEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description || '',
      price: String(row.price),
      weight: row.weight ? String(row.weight) : '',
      purity: row.purity || '',
      sku: row.sku || '',
      categoryId: row.categoryId,
      isAvailable: String(row.isAvailable),
      isActive: String(row.isActive),
    });
    setOpen(true);
  };

  const exportProducts = async () => {
    const res = await excelApi.exportProducts();
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Product', flex: 1.2, minWidth: 200 },
    { field: 'category', headerName: 'Category', width: 150, valueGetter: (p) => p.row.category?.name || '-' },
    { field: 'price', headerName: 'Price', width: 120, valueGetter: (p) => `₹${Number(p.row.price).toLocaleString()}` },
    { field: 'purity', headerName: 'Purity', width: 100 },
    { field: 'sku', headerName: 'SKU', width: 130 },
    { field: 'isAvailable', headerName: 'Availability', width: 130, renderCell: (p) => <Chip size='small' label={p.value ? 'Available' : 'Out'} color={p.value ? 'success' : 'warning'} /> },
    { field: 'actions', headerName: 'Actions', width: 120, sortable: false, renderCell: (p) => (
      <Box>
        <IconButton size='small' onClick={() => onEdit(p.row)}><Edit fontSize='small' /></IconButton>
        <IconButton size='small' color='error' onClick={() => onDelete(p.row.id)}><Delete fontSize='small' /></IconButton>
      </Box>
    ) },
  ];

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <Box>
          <Typography variant='h4' fontWeight={700}>Products</Typography>
          <Typography variant='body2' color='text.secondary'>Catalog management and inventory visibility</Typography>
        </Box>
        <Box sx={{ display:'flex', gap:1 }}>
          <Button variant='outlined' onClick={exportProducts}>Export Excel</Button>
          <Button startIcon={<Add />} variant='contained' onClick={() => { resetForm(); setOpen(true); }}>Add Product</Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TextField
            sx={{ mb:2, maxWidth:360 }}
            fullWidth
            placeholder='Search products...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position='start'><Search fontSize='small' /></InputAdornment> }}
          />
          <Box sx={{ height: 620 }}>
            <DataGrid rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>{editing ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'grid', gap:2, gridTemplateColumns:'repeat(2,minmax(0,1fr))', mt:1 }}>
            <TextField label='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label='SKU' value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <TextField label='Price' value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <TextField label='Weight (g)' value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <TextField label='Purity' value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} />
            <TextField select SelectProps={{ native: true }} label='Category' value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value=''>Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </TextField>
          </Box>
          <TextField fullWidth multiline minRows={3} label='Description' value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mt:2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={onSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
