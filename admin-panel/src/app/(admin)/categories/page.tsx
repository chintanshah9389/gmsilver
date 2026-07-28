'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await categoriesApi.getAll({ page: 1, limit: 200 });
      setRows(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', isActive: true, sortOrder: 0 });
    setEditing(null);
  };

  const onSave = async () => {
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.description) fd.append('description', form.description);
      fd.append('isActive', String(form.isActive));
      fd.append('sortOrder', String(form.sortOrder));

      if (editing) {
        await categoriesApi.update(editing.id, fd);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(fd);
        toast.success('Category created');
      }

      setOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const onEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description || '',
      isActive: row.isActive,
      sortOrder: row.sortOrder || 0,
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoriesApi.delete(id);
      toast.success('Category deleted');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
    { field: 'description', headerName: 'Description', flex: 1.4, minWidth: 240 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 130,
      renderCell: (p) => (
        <Chip label={p.value ? 'Active' : 'Inactive'} color={p.value ? 'success' : 'default'} size='small' />
      ),
    },
    { field: 'sortOrder', headerName: 'Sort', width: 90 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (p) => (
        <Box>
          <IconButton size='small' onClick={() => onEdit(p.row)}><Edit fontSize='small' /></IconButton>
          <IconButton size='small' color='error' onClick={() => onDelete(p.row.id)}><Delete fontSize='small' /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h4' fontWeight={700}>Categories</Typography>
          <Typography variant='body2' color='text.secondary'>Manage product categories</Typography>
        </Box>
        <Button startIcon={<Add />} variant='contained' onClick={() => { resetForm(); setOpen(true); }}>Add Category</Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ height: 620 }}>
            <DataGrid rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? 'Edit Category' : 'Create Category'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth multiline minRows={3} label='Description' value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth type='number' label='Sort Order' value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} sx={{ mb: 1 }} />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label='Active' />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={onSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
