'use client';

import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { categoriesApi, homeWidgetsApi, productsApi } from '@/lib/api';

const LINK_TYPES = ['NONE', 'PRODUCT', 'CATEGORY'];

export default function HomeWidgetsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: 'Top Products',
    linkType: 'NONE',
    linkId: '',
    isActive: true,
  });

  const selectedProduct = products.find((product) => product.id === form.linkId) ?? null;
  const selectedCategory = categories.find((category) => category.id === form.linkId) ?? null;

  const fetchWidget = async () => {
    try {
      setLoading(true);
      const [widgetRes, productsRes, categoriesRes] = await Promise.all([
        homeWidgetsApi.getTopProducts(),
        productsApi.getAll({ page: 1, limit: 200 }),
        categoriesApi.getAll({ page: 1, limit: 200 }),
      ]);

      const data = widgetRes.data.data;
      setForm({
        title: data.title || 'Top Products',
        linkType: data.linkType || 'NONE',
        linkId: data.linkId || '',
        isActive: data.isActive ?? true,
      });
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load widget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidget();
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (form.linkType !== 'NONE' && !form.linkId) {
      toast.error(`Select a ${form.linkType === 'PRODUCT' ? 'product' : 'category'} for the redirect`);
      return;
    }

    setSaving(true);
    try {
      await homeWidgetsApi.updateTopProducts({
        title: form.title.trim(),
        linkType: form.linkType,
        linkId: form.linkType === 'NONE' ? '' : form.linkId.trim(),
        isActive: form.isActive,
      });
      toast.success('Top products widget updated');
      fetchWidget();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
      }}>
        <Typography variant="h5" fontWeight={700}>Home Widgets</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure the Top Products block shown on the mobile home screen.
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: '#0F0F1A', border: '1px solid #1E1E2E', maxWidth: 720 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Section Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            fullWidth
            size="small"
            disabled={loading}
          />

          <TextField
            select
            label="View More Redirect"
            value={form.linkType}
            onChange={(e) => setForm({ ...form, linkType: e.target.value, linkId: '' })}
            fullWidth
            size="small"
            disabled={loading}
          >
            {LINK_TYPES.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>

          {form.linkType === 'PRODUCT' ? (
            <Autocomplete
              options={products}
              value={selectedProduct}
              onChange={(_, value) => setForm({ ...form, linkId: value?.id || '' })}
              getOptionLabel={(option) => `${option.name}${option.sku ? ` (${option.sku})` : ''}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product"
                  size="small"
                  helperText={form.linkId ? `Product ID: ${form.linkId}` : 'Search and choose which product opens when View More is tapped'}
                />
              )}
            />
          ) : null}

          {form.linkType === 'CATEGORY' ? (
            <Autocomplete
              options={categories}
              value={selectedCategory}
              onChange={(_, value) => setForm({ ...form, linkId: value?.id || '' })}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  size="small"
                  helperText={form.linkId ? `Category ID: ${form.linkId}` : 'Search and choose which category product list opens when View More is tapped'}
                />
              )}
            />
          ) : null}

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                disabled={loading}
              />
            }
            label="Widget Active"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleSave} disabled={loading || saving} sx={{ borderRadius: 2 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}