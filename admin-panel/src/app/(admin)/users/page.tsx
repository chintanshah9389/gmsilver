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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Button,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
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
import { ADMIN_PAGE_SIZE, ADMIN_PAGE_SIZE_OPTIONS } from '@/lib/pagination';
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(ADMIN_PAGE_SIZE);
  const [rowCount, setRowCount] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsUserId, setCredentialsUserId] = useState<string | null>(null);
  const [credentialsForm, setCredentialsForm] = useState({
    password: '',
    mpin: '',
  });
  const [credentialsErrors, setCredentialsErrors] = useState<{
    password?: string;
    mpin?: string;
  }>({});
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
    status: 'APPROVED',
  });
  const [createErrors, setCreateErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    status?: string;
  }>({});

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
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const validateCreateForm = () => {
    const nextErrors: typeof createErrors = {};

    if (!createForm.name.trim()) {
      nextErrors.name = 'Name is required';
    } else if (createForm.name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters';
    }

    if (!createForm.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (createForm.phone.trim() && createForm.phone.trim().length < 7) {
      nextErrors.phone = 'Phone number looks too short';
    }

    if (!createForm.password) {
      nextErrors.password = 'Password is required';
    } else if (/\s/.test(createForm.password)) {
      nextErrors.password = 'Password cannot contain spaces';
    } else if (createForm.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(createForm.password)) {
      nextErrors.password = 'Password must include uppercase, lowercase, number and special character';
    }

    setCreateErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateCreateField = (
    field: keyof typeof createForm,
    value: string,
  ) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCreateUser = async () => {
    if (!validateCreateForm()) {
      return;
    }

    try {
      setCreateLoading(true);
      await usersApi.create({
        ...createForm,
        phone: createForm.phone || undefined,
      });
      toast.success('User created successfully');
      setCreateOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'CUSTOMER',
        status: 'APPROVED',
      });
      setCreateErrors({});
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
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

  const updateRole = async (role: string) => {
    if (!selectedUser) return;
    try {
      await usersApi.updateRole(selectedUser.id, role);
      toast.success(`User role updated to ${role}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      handleMenuClose();
    }
  };

  const openCredentialsDialog = () => {
    if (!selectedUser) return;
    setCredentialsUserId(selectedUser.id);
    setCredentialsForm({ password: '', mpin: '' });
    setCredentialsErrors({});
    setCredentialsOpen(true);
    handleMenuClose();
  };

  const validateCredentialsForm = () => {
    const nextErrors: typeof credentialsErrors = {};
    const password = credentialsForm.password.trim();
    const mpin = credentialsForm.mpin.trim();

    if (!password && !mpin) {
      nextErrors.password = 'Provide password or MPIN';
      nextErrors.mpin = 'Provide password or MPIN';
    }

    if (password) {
      if (/\s/.test(password)) {
        nextErrors.password = 'Password cannot contain spaces';
      } else if (password.length < 6) {
        nextErrors.password = 'Password must be at least 6 characters';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
        nextErrors.password = 'Password must include uppercase, lowercase, number and special character';
      }
    }

    if (mpin && !/^\d{6}$/.test(mpin)) {
      nextErrors.mpin = 'MPIN must be exactly 6 digits';
    }

    setCredentialsErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdateCredentials = async () => {
    if (!credentialsUserId) return;
    if (!validateCredentialsForm()) return;

    try {
      setCredentialsLoading(true);
      await usersApi.updateCredentials(credentialsUserId, {
        password: credentialsForm.password.trim() || undefined,
        mpin: credentialsForm.mpin.trim() || undefined,
      });
      toast.success('User credentials updated successfully');
      setCredentialsOpen(false);
      setCredentialsUserId(null);
      setCredentialsForm({ password: '', mpin: '' });
      setCredentialsErrors({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update credentials');
    } finally {
      setCredentialsLoading(false);
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
      field: 'companyName',
      headerName: 'Company',
      flex: 1,
      minWidth: 140,
      valueGetter: (params) => params.row.companyName || '-',
    },
    {
      field: 'city',
      headerName: 'City / Destination',
      flex: 1,
      minWidth: 140,
      valueGetter: (params) => params.row.city || '-',
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

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>User Management</Typography>
          <Typography variant='body2' color='text.secondary'>View and manage platform users</Typography>
        </Box>
        <Button variant='contained' onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2 }}>Add User</Button>
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
              pageSizeOptions={[...ADMIN_PAGE_SIZE_OPTIONS]}
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
        {selectedUser?.role !== 'CUSTOMER' && (
          <MenuItem onClick={() => updateRole('CUSTOMER')}>
            Set role: Customer
          </MenuItem>
        )}
        {selectedUser?.role !== 'ADMIN' && (
          <MenuItem onClick={() => updateRole('ADMIN')}>
            Set role: Admin
          </MenuItem>
        )}
        {selectedUser?.role !== 'OWNER' && (
          <MenuItem onClick={() => updateRole('OWNER')}>
            Set role: Owner
          </MenuItem>
        )}
        <MenuItem onClick={openCredentialsDialog}>
          Update Password / MPIN
        </MenuItem>
        <MenuItem onClick={deleteUser} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={credentialsOpen}
        onClose={() => {
          setCredentialsOpen(false);
          setCredentialsUserId(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update User Credentials</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="New Password"
              type="password"
              value={credentialsForm.password}
              onChange={(e) => {
                setCredentialsForm((prev) => ({ ...prev, password: e.target.value }));
                setCredentialsErrors((prev) => ({ ...prev, password: undefined }));
              }}
              fullWidth
              error={!!credentialsErrors.password}
              helperText={
                credentialsErrors.password ||
                'Optional. 8+ chars with uppercase, lowercase, number, special character'
              }
            />
            <TextField
              label="New MPIN"
              type="password"
              value={credentialsForm.mpin}
              onChange={(e) => {
                setCredentialsForm((prev) => ({ ...prev, mpin: e.target.value }));
                setCredentialsErrors((prev) => ({ ...prev, mpin: undefined }));
              }}
              fullWidth
              error={!!credentialsErrors.mpin}
              helperText={credentialsErrors.mpin || 'Used for mobile app login. Must be exactly 6 digits'}
            />
            <Typography variant="caption" color="text.secondary">
              Update at least one field. Leave the other blank if no change is needed.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCredentialsOpen(false);
              setCredentialsUserId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateCredentials}
            variant="contained"
            disabled={credentialsLoading}
          >
            {credentialsLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create User</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={createForm.name}
              onChange={(e) => updateCreateField('name', e.target.value)}
              fullWidth
              error={!!createErrors.name}
              helperText={createErrors.name}
            />
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => updateCreateField('email', e.target.value)}
              fullWidth
              error={!!createErrors.email}
              helperText={createErrors.email}
            />
            <TextField
              label="Phone"
              value={createForm.phone}
              onChange={(e) => updateCreateField('phone', e.target.value)}
              fullWidth
              error={!!createErrors.phone}
              helperText={createErrors.phone || 'Optional'}
            />
            <TextField
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => updateCreateField('password', e.target.value)}
              fullWidth
              error={!!createErrors.password}
              helperText={createErrors.password || 'At least 6 characters, no spaces'}
            />
            <FormControl fullWidth error={!!createErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={createForm.role}
                onChange={(e) => updateCreateField('role', e.target.value)}
              >
                <MenuItem value="CUSTOMER">CUSTOMER</MenuItem>
                <MenuItem value="OWNER">OWNER</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
              <FormHelperText>{createErrors.role}</FormHelperText>
            </FormControl>
            <FormControl fullWidth error={!!createErrors.status}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={createForm.status}
                onChange={(e) => updateCreateField('status', e.target.value)}
              >
                <MenuItem value="APPROVED">APPROVED</MenuItem>
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="REJECTED">REJECTED</MenuItem>
                <MenuItem value="BLOCKED">BLOCKED</MenuItem>
              </Select>
              <FormHelperText>{createErrors.status}</FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={createLoading}>
            {createLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
