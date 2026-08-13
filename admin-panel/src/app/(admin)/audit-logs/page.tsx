'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Delete, FilterAltOff, Search, Visibility } from '@mui/icons-material';
import { auditLogsApi } from '@/lib/api';
import toast from 'react-hot-toast';

type AuditUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
};

type AuditLogRow = {
  id: string;
  action: string;
  module: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  data?: any;
  createdAt: string;
  user?: AuditUser | null;
};

const MODULES = [
  'AUTH',
  'USER',
  'PRODUCT',
  'CATEGORY',
  'CART',
  'ORDER',
  'WISHLIST',
  'INVOICE',
  'NOTIFICATION',
  'BANNER',
  'HOME_WIDGETS',
  'EXCEL',
];

function toIso(date: string, time: string, endOfDay = false): string | undefined {
  if (!date) return undefined;
  const clock = time || (endOfDay ? '23:59:59' : '00:00:00');
  const withSeconds = clock.length === 5 ? `${clock}:00` : clock;
  const local = new Date(`${date}T${withSeconds}`);
  if (Number.isNaN(local.getTime())) return undefined;
  return local.toISOString();
}

function formatStamp(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditLogsPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [users, setUsers] = useState<AuditUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [rowCount, setRowCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const [userId, setUserId] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [applied, setApplied] = useState({
    userId: '',
    moduleName: '',
    search: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const selectedUser = useMemo(
    () => users.find((user) => user.id === userId) || null,
    [users, userId],
  );

  const fetchUsers = async () => {
    try {
      const res = await auditLogsApi.getUsers();
      setUsers(res.data.data || []);
    } catch {
      setUsers([]);
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditLogsApi.getAll({
        page: page + 1,
        limit: pageSize,
        userId: applied.userId || undefined,
        module: applied.moduleName || undefined,
        search: applied.search || undefined,
        startDate: toIso(applied.startDate, applied.startTime, false),
        endDate: toIso(applied.endDate, applied.endTime, true),
      });
      setRows(res.data.data || []);
      setRowCount(Number(res.data.meta?.total || 0));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [applied, page, pageSize]);

  useEffect(() => {
    void fetchUsers();
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const applyFilters = () => {
    setPage(0);
    setApplied({
      userId,
      moduleName,
      search: search.trim(),
      startDate,
      startTime,
      endDate,
      endTime,
    });
  };

  const clearFilters = () => {
    setUserId('');
    setModuleName('');
    setSearch('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setPage(0);
    setApplied({
      userId: '',
      moduleName: '',
      search: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
    });
  };

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
    {
      field: 'createdAt',
      headerName: 'Date & Time',
      width: 200,
      valueGetter: (p) => formatStamp(p.row.createdAt),
    },
    {
      field: 'user',
      headerName: 'User',
      width: 240,
      valueGetter: (p) => p.row.user?.name || 'Guest',
      renderCell: (p) => (
        <Box sx={{ lineHeight: 1.2 }}>
          <Typography variant='body2' fontWeight={600}>
            {p.row.user?.name || 'Guest'}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {p.row.user?.email || p.row.user?.role || 'Unauthenticated'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'module',
      headerName: 'Module',
      width: 140,
      renderCell: (p) => <Chip size='small' label={p.value} />,
    },
    { field: 'action', headerName: 'Action', width: 220 },
    { field: 'ipAddress', headerName: 'IP', width: 140 },
    {
      field: 'userAgent',
      headerName: 'Device / Browser',
      flex: 1,
      minWidth: 220,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box>
          <IconButton
            size='small'
            title='View details'
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLog(params.row);
            }}
          >
            <Visibility fontSize='small' />
          </IconButton>
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
          <Typography variant='h5' fontWeight={700}>Audit Logs</Typography>
          <Typography variant='body2' color='text.secondary'>
            Login and every later step for all users — filter by person, date, and time
          </Typography>
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

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1.2fr' },
            gap: 2,
            mb: 2,
          }}>
            <Autocomplete
              options={users}
              value={selectedUser}
              onChange={(_, value) => setUserId(value?.id || '')}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} label='User' placeholder='All users' />
              )}
            />
            <TextField
              select
              label='Module'
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
            >
              <MenuItem value=''>All modules</MenuItem>
              {MODULES.map((mod) => (
                <MenuItem key={mod} value={mod}>{mod}</MenuItem>
              ))}
            </TextField>
            <TextField
              label='Search action, name, email, or IP'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
            />
          </Box>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr) auto auto' },
            gap: 2,
            alignItems: 'center',
          }}>
            <TextField
              label='From date'
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label='From time'
              type='time'
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <TextField
              label='To date'
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label='To time'
              type='time'
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60 }}
            />
            <Button
              variant='contained'
              startIcon={<Search />}
              onClick={applyFilters}
              sx={{ borderRadius: 2, height: 56 }}
            >
              Apply
            </Button>
            <Button
              variant='outlined'
              startIcon={<FilterAltOff />}
              onClick={clearFilters}
              sx={{ borderRadius: 2, height: 56 }}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
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
              paginationMode='server'
              rowCount={rowCount}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              rowHeight={64}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Activity details</DialogTitle>
        <DialogContent dividers>
          {selectedLog ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant='body2'><b>Time:</b> {formatStamp(selectedLog.createdAt)}</Typography>
              <Typography variant='body2'>
                <b>User:</b> {selectedLog.user?.name || 'Guest'}
                {selectedLog.user?.email ? ` (${selectedLog.user.email})` : ''}
              </Typography>
              <Typography variant='body2'><b>Module:</b> {selectedLog.module}</Typography>
              <Typography variant='body2'><b>Action:</b> {selectedLog.action}</Typography>
              <Typography variant='body2'><b>IP:</b> {selectedLog.ipAddress || '—'}</Typography>
              <Typography variant='body2'><b>Device:</b> {selectedLog.userAgent || '—'}</Typography>
              <Box
                component='pre'
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(192,192,192,0.08)',
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                {JSON.stringify(selectedLog.data || {}, null, 2)}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
