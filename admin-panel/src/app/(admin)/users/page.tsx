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
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Search,
  MoreVert,
  CheckCircle,
  Cancel,
  Block,
  Delete,
} from '@mui/icons-material';
import { usersApi } from '@/lib/api';
import toast from 'react-hot-toast';

const statusColors: Record<string, any> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  BLOCKED: 'default',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll({
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
      });

      setUsers(response.data.data);
      setRowCount(response.data.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const updateStatus = async (status: string) => {
    if (!selectedUser) return;
    try {
      await usersApi.updateStatus(selectedUser.id, status);
      toast.success(`User ${status.toLowerCase()} successfully`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      handleMenuClose();
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersApi.delete(selectedUser.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      handleMenuClose();
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 1,
      minWidth: 130,
      valueGetter: (params) => params.row.phone || '-',
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'ADMIN' ? 'error' : params.value === 'OWNER' ? 'warning' : 'default'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={statusColors[params.value] || 'default'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Registered',
      width: 130,
      valueGetter: (params) =>
        new Date(params.row.createdAt).toLocaleDateString('en-IN'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => handleMenuOpen(e, params.row)}
          size="small"
        >
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage platform users
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2, maxWidth: 400 }}>
            <TextField
              fullWidth
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={users}
              columns={columns}
              loading={loading}
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
              sx={{ border: 'none' }}
            />
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => updateStatus('APPROVED')}>
          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
          Approve
        </MenuItem>
        <MenuItem onClick={() => updateStatus('REJECTED')}>
          <Cancel fontSize="small" sx={{ mr: 1 }} />
          Reject
        </MenuItem>
        <MenuItem onClick={() => updateStatus('BLOCKED')}>
          <Block fontSize="small" sx={{ mr: 1 }} />
          Block
        </MenuItem>
        <MenuItem onClick={deleteUser} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
