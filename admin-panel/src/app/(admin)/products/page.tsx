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
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Add, Search, Delete, Edit, PictureAsPdf } from '@mui/icons-material';
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
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteFailed, setBulkDeleteFailed] = useState<Array<{ id: string; reason: string }>>([]);
  const [openBulkDeleteFailed, setOpenBulkDeleteFailed] = useState(false);
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
    setSelectedIds((prev) => prev.filter((id) => rows.some((row) => row.id === id)));
  }, [rows]);

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

  const getExistingImages = (product: any): Array<{ imageUrl: string }> => {
    if (!product) return [];

    // Backward/forward compatible normalization for edit modal preview.
    const fromArray = Array.isArray(product.images)
      ? product.images
          .map((img: any) => img?.imageUrl || img?.url)
          .filter((url: any): url is string => Boolean(url))
      : [];

    const fromSlots = [product.image1Url, product.image2Url, product.image3Url].filter(
      (url: any): url is string => Boolean(url),
    );

    const ordered = fromArray.length > 0 ? fromArray : fromSlots;
    return ordered.slice(0, MAX_PRODUCT_IMAGES).map((imageUrl: string) => ({ imageUrl }));
  };

  const getSelectedImageFiles = () => imageFiles.filter((file): file is File => file !== null);

  const handleImageSelection = (slotIndex: number, fileList: FileList | null) => {
    const selectedFile = fileList?.[0] || null;
    const existingImageCount = getExistingImages(editing).length;
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

      if (!form.sku?.trim()) {
        toast.error('SKU is required');
        return;
      }

      if (!editing && selectedImageFiles.length === 0) {
        toast.error('Please upload at least one product image');
        return;
      }

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, String(v)); });

      if (selectedImageFiles.length > 0) {
        selectedImageFiles.forEach((file) => fd.append('images', file));
      }

      if (pdfFile) {
        fd.append('pdf', pdfFile);
      }

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

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one product');
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;

    try {
      setBulkDeleting(true);
      const ids = selectedIds.map((id) => String(id));
      const res = await productsApi.bulkDelete(ids);
      const result = res.data?.data || res.data;
      const deletedCount = Number(result?.deletedCount || 0);
      const failedCount = Number(result?.failedCount || 0);
      const failedItems = Array.isArray(result?.failed) ? result.failed : [];

      if (deletedCount > 0) {
        toast.success(`${deletedCount} product(s) deleted`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} product(s) failed to delete`);
        setBulkDeleteFailed(
          failedItems.map((item: any) => ({
            id: String(item?.id || ''),
            reason: String(item?.reason || 'Failed to delete product'),
          })),
        );
        setOpenBulkDeleteFailed(true);
      }

      if (deletedCount === 0 && failedCount === 0) {
        toast('No products were deleted');
      }

      setSelectedIds([]);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
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
    { field: 'isAvailable', headerName: 'Availability', width: 140, renderCell: (p) => <Chip size='small' label={p.value ? 'In Stock' : 'Out of Stock'} color={p.value ? 'success' : 'warning'} /> },
    { field: 'pdfUrl', headerName: 'PDF', width: 70, sortable: false, renderCell: (p) => p.row.pdfUrl ? (
      <IconButton size='small' color='error' title='View PDF' onClick={() => window.open(p.row.pdfUrl, '_blank')}>
        <PictureAsPdf fontSize='small' />
      </IconButton>
    ) : null },
    { field: 'actions', headerName: 'Actions', width: 120, sortable: false, renderCell: (p) => (
      <Box>
        <IconButton size='small' onClick={() => onEdit(p.row)}><Edit fontSize='small' /></IconButton>
        <IconButton size='small' color='error' onClick={() => onDelete(p.row.id)}><Delete fontSize='small' /></IconButton>
      </Box>
    ) },
  ];

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Products</Typography>
          <Typography variant='body2' color='text.secondary'>Catalog management and inventory visibility</Typography>
        </Box>
        <Box sx={{ display:'flex', gap:1, flexWrap: 'wrap' }}>
          <Button
            variant='outlined'
            color='error'
            startIcon={<Delete />}
            disabled={selectedIds.length === 0 || bulkDeleting}
            onClick={onDeleteSelected}
            sx={{ borderRadius: 2 }}
          >
            {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
          </Button>
          <Button variant='outlined' onClick={exportProducts} sx={{ borderRadius: 2 }}>Export</Button>
          <Button startIcon={<Add />} variant='contained' onClick={() => { resetForm(); setOpen(true); }} sx={{ borderRadius: 2 }}>Add Product</Button>
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>{editing ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'grid', gap:2, gridTemplateColumns:'repeat(2,minmax(0,1fr))', mt:1 }}>
            <TextField label='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField required label='SKU' value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} />
            <TextField label='Price' value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <TextField label='Weight (g)' value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <TextField label='Purity' value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} />
            <TextField label='Quantity' type='number' inputProps={{ min: 0 }} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <TextField select SelectProps={{ native: true }} label='Category' value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value=''>Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </TextField>
            <TextField
              select
              SelectProps={{ native: true }}
              label='Availability'
              value={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.value })}
              helperText='Out of Stock disables Add to Cart in the mobile app'
            >
              <option value='true'>Available (In Stock)</option>
              <option value='false'>Out of Stock</option>
            </TextField>
            <TextField
              select
              SelectProps={{ native: true }}
              label='Active'
              value={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.value })}
              helperText='Inactive products are hidden from the catalog'
            >
              <option value='true'>Active</option>
              <option value='false'>Inactive</option>
            </TextField>
          </Box>
          <TextField fullWidth multiline minRows={3} label='Description' value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={{ mt:2 }} />
          <Box sx={{ display:'grid', gap:2, gridTemplateColumns:'repeat(3,minmax(0,1fr))', mt: 2 }}>
            {[0, 1, 2].map((slotIndex) => {
              const slotLabel = `Image ${slotIndex + 1}`;
              const selectedFile = imageFiles[slotIndex];
              const existingImage = getExistingImages(editing)[slotIndex];
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
              ? `Selected images will replace image slots from left to right. ${Math.max(MAX_PRODUCT_IMAGES - getExistingImages(editing).length, 0)} empty slot(s) currently available.`
              : 'At least one image is required. You can upload up to 3 images, 500KB each.'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            <Button
              component='label'
              variant='outlined'
              startIcon={<PictureAsPdf />}
            >
              {pdfFile ? pdfFile.name : editing?.pdfUrl ? 'Replace PDF' : 'Upload Product PDF'}
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
            {editing?.pdfUrl && (
              <Button
                variant='text'
                color='error'
                startIcon={<PictureAsPdf />}
                onClick={() => window.open(editing.pdfUrl, '_blank')}
              >
                View Current PDF
              </Button>
            )}
          </Box>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
            {editing?.pdfUrl
              ? 'A PDF is already attached. Selecting a new file will replace it. PDF size must be 2MB or less.'
              : 'One optional PDF can be uploaded per product. PDF size must be 2MB or less.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={onSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openBulkDeleteFailed}
        onClose={() => setOpenBulkDeleteFailed(false)}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle>Some Products Could Not Be Deleted</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            These selected products were not deleted. Check the reason for each record.
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {bulkDeleteFailed.map((item) => (
              <Box
                key={`${item.id}-${item.reason}`}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  p: 1.5,
                }}
              >
                <Typography variant='subtitle2'>{item.id}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {item.reason}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenBulkDeleteFailed(false);
              setBulkDeleteFailed([]);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
