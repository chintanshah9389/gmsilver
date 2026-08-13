'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Delete, Search } from '@mui/icons-material';
import { auditLogsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditLogsApi.getAll({ page: 1, limit: 200, action: search || undefined });
      setRows(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [search]);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this audit log?')) return;
    try {
      await auditLogsApi.delete(id);
      toast.success('Audit log deleted');
      setSelectedIds((prev) => prev.filter((selectedId) => String(selectedId) !== id));
      await fetchLogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one audit log');
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} selected audit log(s)?`)) return;

    try {
      setBulkDeleting(true);
      const ids = selectedIds.map((id) => String(id));
      const res = await auditLogsApi.bulkDelete(ids);
      const result = res.data?.data || res.data;
      const deletedCount = Number(result?.deletedCount || 0);
      const failedCount = Number(result?.failedCount || 0);

      if (deletedCount > 0) {
        toast.success(`${deletedCount} audit log(s) deleted`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} audit log(s) could not be deleted`);
      }
      if (deletedCount === 0 && failedCount === 0) {
        toast('No audit logs were deleted');
      }

      setSelectedIds([]);
      await fetchLogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'createdAt', headerName: 'Timestamp', width: 180, valueGetter: (p) => new Date(p.row.createdAt).toLocaleString('en-IN') },
    { field: 'user', headerName: 'User', width: 220, valueGetter: (p) => p.row.user?.name || 'Guest' },
    { field: 'module', headerName: 'Module', width: 140, renderCell: (p) => <Chip size='small' label={p.value} /> },
    { field: 'action', headerName: 'Action', width: 180 },
    { field: 'ipAddress', headerName: 'IP', width: 150 },
    { field: 'userAgent', headerName: 'User Agent', flex: 1, minWidth: 260 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size='small'
          color='error'
          title='Delete'
          onClick={(e) => {
            e.stopPropagation();
            void onDelete(params.row.id);
          }}
        >
          <Delete fontSize='small' />
        </IconButton>
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
          <Typography variant='h5' fontWeight={700}>Audit Logs</Typography>
          <Typography variant='body2' color='text.secondary'>Track platform events and user activity trails</Typography>
        </Box>
        <Button
          variant='outlined'
          color='error'
          startIcon={<Delete />}
          disabled={selectedIds.length === 0 || bulkDeleting}
          onClick={() => void onDeleteSelected()}
          sx={{ borderRadius: 2 }}
        >
          {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
        </Button>
      </Box>
      <Card>
        <CardContent>
          <TextField
            sx={{ mb: 2, maxWidth: 360 }}
            fullWidth
            placeholder='Filter by action...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position='start'><Search fontSize='small' /></InputAdornment> }}
          />
          <Box sx={{ height: 640 }}>
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
    </Box>
  );
}
