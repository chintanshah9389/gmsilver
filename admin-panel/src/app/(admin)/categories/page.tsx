'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, IconButton, Chip, Avatar, Grid,
  Card, CardMedia, CardContent, CardActions, InputAdornment, Skeleton,
} from '@mui/material';
import { Add, Edit, Delete, PhotoCamera, Search, Category } from '@mui/icons-material';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [rows, setRows]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState({ name: '', description: '', isActive: true, sortOrder: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await categoriesApi.getAll({ page: 1, limit: 200 });
      setRows(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', isActive: true, sortOrder: 0 });
    setEditing(null); setImageFile(null); setImagePreview(null);
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSave = async () => {
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.description) fd.append('description', form.description);
      fd.append('isActive', String(form.isActive));
      fd.append('sortOrder', String(form.sortOrder));
      if (imageFile) fd.append('image', imageFile);
      if (editing) { await categoriesApi.update(editing.id, fd); toast.success('Category updated'); }
      else          { await categoriesApi.create(fd);             toast.success('Category created'); }
      setOpen(false); resetForm(); fetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
  };

  const onEdit = (row: any) => {
    setEditing(row);
    setForm({ name: row.name, description: row.description || '', isActive: row.isActive, sortOrder: row.sortOrder || 0 });
    setImageFile(null); setImagePreview(row.imageUrl || null); setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try { await categoriesApi.delete(id); toast.success('Deleted'); fetchData(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const filtered = rows.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)',
        borderRadius: 3, p: 3, mb: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(192,192,192,0.2) 0%, rgba(192,192,192,0.05) 100%)',
            border: '1px solid rgba(192,192,192,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Category sx={{ color: 'primary.main', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>Categories</Typography>
            <Typography variant="body2" color="text.secondary">{rows.length} categories total</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
            sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button startIcon={<Add />} variant="contained" onClick={() => { resetForm(); setOpen(true); }} sx={{ borderRadius: 2 }}>
            Add Category
          </Button>
        </Box>
      </Box>

      {/* Card Grid */}
      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Grid item key={i} xs={12} sm={6} md={4} lg={3}>
                <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
              </Grid>
            ))
          : filtered.map((row) => (
              <Grid item key={row.id} xs={12} sm={6} md={4} lg={3}>
                <Card sx={{
                  height: '100%',
                  background: 'linear-gradient(145deg, rgba(20,20,30,0.95) 0%, rgba(12,12,18,0.95) 100%)',
                  border: '1px solid rgba(192,192,192,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
                }}>
                  {/* Image */}
                  {row.imageUrl ? (
                    <CardMedia component="img" height={160} image={row.imageUrl} alt={row.name} sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{
                      height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(20,20,30,0) 100%)',
                      borderBottom: '1px solid rgba(192,192,192,0.06)',
                    }}>
                      <Typography sx={{ fontSize: 56, color: 'rgba(192,192,192,0.15)', fontWeight: 800, letterSpacing: 4 }}>
                        {row.name?.[0]?.toUpperCase()}
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ pb: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>{row.name}</Typography>
                      <Chip
                        label={row.isActive ? 'Active' : 'Off'}
                        size="small"
                        color={row.isActive ? 'success' : 'default'}
                        sx={{ ml: 1, fontSize: 10, height: 20 }}
                      />
                    </Box>
                    {row.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {row.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="primary.dark" sx={{ mt: 0.5, display: 'block' }}>
                      {row._count?.products ?? 0} products · Sort #{row.sortOrder}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 1.5, pt: 0.5, justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: 'primary.main', '&:hover': { backgroundColor: 'rgba(192,192,192,0.1)' } }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(row.id)} sx={{ '&:hover': { backgroundColor: 'rgba(255,76,76,0.1)' } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
        }
        {!loading && filtered.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <Category sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
              <Typography>No categories found</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { background: '#12121A', border: '1px solid rgba(192,192,192,0.1)', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>{editing ? 'Edit Category' : 'New Category'}</Typography>
        </DialogTitle>
        <DialogContent>
          {/* Image upload zone */}
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              mt: 1, mb: 3, height: 160, borderRadius: 2,
              border: '2px dashed rgba(192,192,192,0.2)',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(192,192,192,0.03)',
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: 'rgba(192,192,192,0.4)' },
            }}
          >
            {imagePreview
              ? <Box component="img" src={imagePreview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                  <PhotoCamera sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="body2">Click to upload image</Typography>
                  <Typography variant="caption">JPG, PNG, WebP · max 500KB</Typography>
                </Box>
            }
            {imagePreview && (
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.7)', borderRadius: 1, px: 1, py: 0.5 }}>
                <Typography variant="caption" color="primary.main">Change</Typography>
              </Box>
            )}
          </Box>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageChange} />

          <TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth multiline minRows={2} label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField fullWidth type="number" label="Sort Order" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={onSave} sx={{ borderRadius: 2 }}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
