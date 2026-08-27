'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Link as MuiLink,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Delete } from '@mui/icons-material';
import { invoicesApi } from '@/lib/api';
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  defaultAdminPaginationModel,
  toApiPage,
} from '@/lib/pagination';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState(defaultAdminPaginationModel);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoicesApi.getAll(toApiPage(paginationModel));
      setRows(res.data.data || []);
      setTotalRows(Number(res.data.meta?.total || 0));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  }, [paginationModel.page, paginationModel.pageSize]);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await invoicesApi.delete(id);
      toast.success('Invoice deleted');
      setSelectedIds((prev) => prev.filter((selectedId) => String(selectedId) !== id));
      await fetchInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one invoice');
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} selected invoice(s)?`)) return;

    try {
      setBulkDeleting(true);
      const ids = selectedIds.map((id) => String(id));
      const res = await invoicesApi.bulkDelete(ids);
      const result = res.data?.data || res.data;
      const deletedCount = Number(result?.deletedCount || 0);
      const failedCount = Number(result?.failedCount || 0);

      if (deletedCount > 0) {
        toast.success(`${deletedCount} invoice(s) deleted`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} invoice(s) could not be deleted`);
      }
      if (deletedCount === 0 && failedCount === 0) {
        toast('No invoices were deleted');
      }

      setSelectedIds([]);
      await fetchInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'orderNumber', headerName: 'Order No', width: 170 },
    { field: 'invoiceNumber', headerName: 'Invoice No', width: 170, valueGetter: (p) => p.row.invoice?.invoiceNumber || '-' },
    { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 180, valueGetter: (p) => p.row.user?.name || '-' },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip size='small' label={p.value} color='success' /> },
    { field: 'total', headerName: 'Total', width: 130, valueGetter: (p) => `₹${Number(p.row.grandTotal).toLocaleString()}` },
    {
      field: 'pdf',
      headerName: 'PDF',
      width: 120,
      renderCell: (p) => p.row.invoice?.pdfUrl ? (
        <MuiLink href={p.row.invoice.pdfUrl} target='_blank' rel='noreferrer'>Open</MuiLink>
      ) : '-',
    },
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
          <Typography variant='h5' fontWeight={700}>Invoices</Typography>
          <Typography variant='body2' color='text.secondary'>Invoice records and PDF links</Typography>
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
              rowCount={totalRows}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[...ADMIN_PAGE_SIZE_OPTIONS]}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
