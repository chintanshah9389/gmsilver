'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, InputAdornment, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search } from '@mui/icons-material';
import { auditLogsApi } from '@/lib/api';

export default function AuditLogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await auditLogsApi.getAll({ page: 1, limit: 200, action: search || undefined });
      setRows(res.data.data);
      setLoading(false);
    })();
  }, [search]);

  const columns: GridColDef[] = [
    { field: 'createdAt', headerName: 'Timestamp', width: 180, valueGetter: (p) => new Date(p.row.createdAt).toLocaleString('en-IN') },
    { field: 'user', headerName: 'User', width: 220, valueGetter: (p) => p.row.user?.name || 'Guest' },
    { field: 'module', headerName: 'Module', width: 140, renderCell: (p) => <Chip size='small' label={p.value} /> },
    { field: 'action', headerName: 'Action', width: 180 },
    { field: 'ipAddress', headerName: 'IP', width: 150 },
    { field: 'userAgent', headerName: 'User Agent', flex: 1, minWidth: 260 },
  ];

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
      }}>
        <Typography variant='h5' fontWeight={700}>Audit Logs</Typography>
        <Typography variant='body2' color='text.secondary'>Track platform events and user activity trails</Typography>
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
            <DataGrid rows={rows} columns={columns} loading={loading} getRowId={(r) => r.id} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
