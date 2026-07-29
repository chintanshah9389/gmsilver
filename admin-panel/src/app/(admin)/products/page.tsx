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

const MAX_PRODUCT_IMAGES = 3;
const MAX_IMAGE_SIZE = 500 * 1024;
const MAX_PDF_SIZE = 2 * 1024 * 1024;

export default function ProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Array<string | null>>([null, null, null]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [form, setForm] = useState<any>({
    name: '', description: '', price: '', weight: '', purity: '', sku: '', categoryId: '', isAvailable: 'true', isActive: 'true', quantity: '0'
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

  useEffect(() => {
    const previewUrls = imageFiles.map((file) => (file ? URL.createObjectURL(file) : null));
    setImagePreviewUrls(previewUrls);

    return () => {
      previewUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageFiles]);

  const resetForm = () => {
    setEditing(null);
    setImageFiles([null, null, null]);
    setImagePreviewUrls([null, null, null]);
    setPdfFile(null);
    setForm({ name: '', description: '', price: '', weight: '', purity: '', sku: '', categoryId: '', isAvailable: 'true', isActive: 'true', quantity: '0' });
  };

  const getSelectedImageFiles = () => imageFiles.filter((file): file is File => file !== null);

  const handleImageSelection = (slotIndex: number, fileList: FileList | null) => {
    const selectedFile = fileList?.[0] || null;
    const existingImageCount = editing?.images?.length || 0;
    const remainingSlots = Math.max(MAX_PRODUCT_IMAGES - existingImageCount, 0);
    const nextFiles = [...imageFiles];
    const selectedSlots = nextFiles.filter((file, index) => file !== null && index !== slotIndex).length;

    if (!selectedFile) {
      nextFiles[slotIndex] = null;
      setImageFiles(nextFiles);
      return;
    }

    if (selectedSlots + 1 > remainingSlots) {
      toast.error(
        editing
          ? `You can add up to ${remainingSlots} more image(s) for this product`
          : `You can upload up to ${MAX_PRODUCT_IMAGES} images`,
      );
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      toast.error(`Image \"${selectedFile.name}\" exceeds the 500KB limit`);
      return;
    }

    nextFiles[slotIndex] = selectedFile;
    setImageFiles(nextFiles);
  };

  const handlePdfSelection = (files: FileList | null) => {
    const selectedFile = files?.[0] || null;

    if (!selectedFile) {
      setPdfFile(null);
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (selectedFile.size > MAX_PDF_SIZE) {
      toast.error(`PDF \"${selectedFile.name}\" exceeds the 2MB limit`);
      return;
    }

    setPdfFile(selectedFile);
  };

  const onSave = async () => {
    try {
      const selectedImageFiles = getSelectedImageFiles();

      if (!editing && selectedImageFiles.length === 0) {
        toast.error('Please upload at least one product image');
        return;
      }

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, String(v)); });

      if (!editing && selectedImageFiles.length > 0) {
        selectedImageFiles.forEach((file) => fd.append('images', file));
      }

      if (pdfFile) {
        fd.append('pdf', pdfFile);
      }

      if (editing) {
        await productsApi.update(editing.id, fd);

        if (selectedImageFiles.length > 0) {
          const imageFd = new FormData();
          selectedImageFiles.forEach((file) => imageFd.append('images', file));
          await productsApi.addImages(editing.id, imageFd);
        }

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
    setImageFiles([null, null, null]);
    setPdfFile(null);
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
      quantity: String(row.quantity ?? 0),
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
            <TextField label='Quantity' type='number' inputProps={{ min: 0 }} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <TextField select SelectProps={{ native: true }} label='Category' value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value=''>Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </TextField>
          </Box>
          <TextField fullWidth multiline minRows={3} label='Description' value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mt:2 }} />
          <Box sx={{ display:'grid', gap:2, gridTemplateColumns:'repeat(3,minmax(0,1fr))', mt: 2 }}>
            {[0, 1, 2].map((slotIndex) => {
              const slotLabel = `Image ${slotIndex + 1}`;
              const selectedFile = imageFiles[slotIndex];
              const existingImage = editing?.images?.[slotIndex];
              const previewUrl = imagePreviewUrls[slotIndex] || existingImage?.imageUrl;

              return (
                <Box key={slotLabel} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>{slotLabel}</Typography>
                  <Box sx={{ height: 140, borderRadius: 1.5, overflow: 'hidden', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    {previewUrl ? (
                      <Box component='img' src={previewUrl} alt={slotLabel} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Typography variant='caption' color='text.secondary'>No image selected</Typography>
                    )}
                  </Box>
                  <Button component='label' variant='outlined' fullWidth>
                    {selectedFile ? selectedFile.name : existingImage ? 'Replace image' : 'Upload image'}
                    <input
                      type='file'
                      accept='image/*'
                      hidden
                      onChange={(e) => {
                        handleImageSelection(slotIndex, e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </Button>
                  {selectedFile && (
                    <Button fullWidth sx={{ mt: 1 }} onClick={() => handleImageSelection(slotIndex, null)}>
                      Clear
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
            {editing
              ? `Selected images will be added to this product. ${Math.max(MAX_PRODUCT_IMAGES - (editing.images?.length || 0), 0)} image slot(s) remaining.`
              : 'At least one image is required. You can upload up to 3 images, 500KB each.'}
          </Typography>
          <Button
            component='label'
            variant='outlined'
            sx={{ mt: 2 }}
          >
            {pdfFile ? pdfFile.name : 'Upload Product PDF'}
            <input
              type='file'
              accept='application/pdf'
              hidden
              onChange={(e) => {
                handlePdfSelection(e.target.files);
                e.target.value = '';
              }}
            />
          </Button>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
            {editing && editing.pdfUrl
              ? 'A PDF is already attached. Selecting a new file will replace it. PDF size must be 2MB or less.'
              : 'One optional PDF can be uploaded per product. PDF size must be 2MB or less.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={onSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
