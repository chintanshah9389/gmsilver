'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Delete, Edit, ViewCarousel } from '@mui/icons-material';
import { bannersApi } from '@/lib/api';
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  defaultAdminPaginationModel,
  toApiPage,
} from '@/lib/pagination';
import toast from 'react-hot-toast';

const BANNER_TYPES = ['NEW', 'SALE', 'MARKETING', 'FEATURED'];
const LINK_TYPES = ['NONE', 'PRODUCT', 'CATEGORY'];
const MAX_IMAGE_SIZE = 500 * 1024; // 500 KB

const BADGE_COLORS: Record<string, 'success' | 'error' | 'primary' | 'warning'> = {
  NEW: 'success',
  SALE: 'error',
  MARKETING: 'primary',
  FEATURED: 'warning',
};

const emptyForm = {
  title: '',
  subtitle: '',
  badgeLabel: 'NEW',
  linkType: 'NONE',
  linkId: '',
  isActive: true,
  sortOrder: '0',
};

export default function BannersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState(defaultAdminPaginationModel);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await bannersApi.getAll({
        all: 'true',
        ...toApiPage(paginationModel),
      });
      setRows(res.data.data || []);
      setTotalRows(Number(res.data.meta?.total || res.data.data?.length || 0));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paginationModel.page, paginationModel.pageSize]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      title: row.title,
      subtitle: row.subtitle || '',
      badgeLabel: row.badgeLabel,
      linkType: row.linkType,
      linkId: row.linkId || '',
      isActive: row.isActive,
      sortOrder: String(row.sortOrder),
    });
    setImageFile(null);
    setImagePreview(row.imageUrl || null);
    setOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be under 500 KB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      if (form.subtitle.trim()) fd.append('subtitle', form.subtitle.trim());
      fd.append('badgeLabel', form.badgeLabel);
      fd.append('linkType', form.linkType);
      if (form.linkType !== 'NONE' && form.linkId.trim()) fd.append('linkId', form.linkId.trim());
      fd.append('isActive', String(form.isActive));
      fd.append('sortOrder', form.sortOrder || '0');
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await bannersApi.update(editing.id, fd);
        toast.success('Banner updated');
      } else {
        await bannersApi.create(fd);
        toast.success('Banner created');
      }

      setOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await bannersApi.delete(id);
      toast.success('Banner deleted');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'imageUrl',
      headerName: 'Image',
      width: 80,
      sortable: false,
      renderCell: (params) =>
        params.value ? (
          <Avatar src={params.value} variant="rounded" sx={{ width: 52, height: 36, mt: 1 }} />
        ) : (
          <Avatar variant="rounded" sx={{ width: 52, height: 36, mt: 1, bgcolor: '#2A2A3F' }}>
            <ViewCarousel fontSize="small" />
          </Avatar>
        ),
    },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'subtitle', headerName: 'Subtitle', flex: 1 },
    {
      field: 'badgeLabel',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={BADGE_COLORS[params.value] ?? 'default'}
          size="small"
        />
      ),
    },
    { field: 'linkType', headerName: 'Link To', width: 110 },
    { field: 'sortOrder', headerName: 'Order', width: 80 },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 90,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => openEdit(params.row)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Banners</Typography>
          <Typography variant="body2" color="text.secondary">Manage carousel banners shown on the mobile home screen</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>Add Banner</Button>
      </Box>

      <Card sx={{ backgroundColor: '#0F0F1A', border: '1px solid #1E1E2E' }}>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            autoHeight
            paginationMode='server'
            rowCount={totalRows}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[...ADMIN_PAGE_SIZE_OPTIONS]}
            sx={{
              border: 'none',
              color: '#F2F2F2',
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#151525', color: '#AFAFBA' },
              '& .MuiDataGrid-row': { '&:hover': { backgroundColor: '#1A1A2E' } },
              '& .MuiDataGrid-cell': { borderColor: '#1E1E2E' },
            }}
          />
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#0F0F1A', color: '#F2F2F2' } }}
      >
        <DialogTitle>{editing ? 'Edit Banner' : 'New Banner'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {/* Image upload */}
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              width: '100%',
              height: 160,
              borderRadius: 2,
              border: '2px dashed #2A2A3F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!imagePreview && (
              <Typography variant="body2" color="text.secondary">
                Click to upload banner image (max 500 KB)
              </Typography>
            )}
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />

          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Subtitle"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            fullWidth
            size="small"
          />

          <TextField
            select
            label="Badge Type"
            value={form.badgeLabel}
            onChange={(e) => setForm({ ...form, badgeLabel: e.target.value })}
            fullWidth
            size="small"
          >
            {BANNER_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Link To"
            value={form.linkType}
            onChange={(e) => setForm({ ...form, linkType: e.target.value, linkId: '' })}
            fullWidth
            size="small"
          >
            {LINK_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>

          {form.linkType !== 'NONE' && (
            <TextField
              label={`${form.linkType === 'PRODUCT' ? 'Product' : 'Category'} ID`}
              value={form.linkId}
              onChange={(e) => setForm({ ...form, linkId: e.target.value })}
              fullWidth
              size="small"
              placeholder="Paste the ID here"
            />
          )}

          <TextField
            label="Sort Order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            fullWidth
            size="small"
            helperText="Lower numbers appear first"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
