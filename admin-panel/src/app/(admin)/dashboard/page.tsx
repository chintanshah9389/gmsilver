'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Inventory,
  Category,
  People,
  ShoppingCart,
  Pending,
  CurrencyRupee,
  TrendingUp,
} from '@mui/icons-material';
import { analyticsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';

interface DashboardData {
  users: { total: number; pending: number };
  products: { total: number; active: number };
  categories: number;
  orders: { total: number; pending: number; approved: number; completed: number };
  revenue: { thisMonth: number; lastMonth: number; growth: number };
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary.main',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}) => (
  <Card
    sx={{
      height: '100%',
      background: 'linear-gradient(145deg, rgba(18,18,26,0.9) 0%, rgba(12,12,18,0.9) 100%)',
      border: '1px solid rgba(192,192,192,0.08)',
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: `${color}15`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getDashboard();
      setData(response.data.data);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to GM Silver Admin Panel
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Products"
            value={data.products.total}
            subtitle={`${data.products.active} active`}
            icon={<Inventory />}
            color="#C0C0C0"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Categories"
            value={data.categories}
            icon={<Category />}
            color="#FFD700"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Users"
            value={data.users.total}
            subtitle={`${data.users.pending} pending approval`}
            icon={<People />}
            color="#64B5F6"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Orders"
            value={data.orders.total}
            subtitle={`${data.orders.pending} pending`}
            icon={<ShoppingCart />}
            color="#4CAF50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending Orders"
            value={data.orders.pending}
            icon={<Pending />}
            color="#FFB347"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Approved Orders"
            value={data.orders.approved}
            icon={<TrendingUp />}
            color="#64B5F6"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Completed Orders"
            value={data.orders.completed}
            icon={<ShoppingCart />}
            color="#4CAF50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Revenue (This Month)"
            value={`₹${data.revenue.thisMonth.toLocaleString()}`}
            subtitle={`${data.revenue.growth >= 0 ? '+' : ''}${data.revenue.growth}% vs last month`}
            icon={<CurrencyRupee />}
            color={data.revenue.growth >= 0 ? '#4CAF50' : '#FF4C4C'}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Insights
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
              <Chip label={`Users Pending: ${data.users.pending}`} color="warning" />
              <Chip label={`Orders Pending: ${data.orders.pending}`} color="warning" />
              <Chip label={`Active Products: ${data.products.active}`} color="success" />
              <Chip
                label={`Monthly Growth: ${data.revenue.growth.toFixed(2)}%`}
                color={data.revenue.growth >= 0 ? 'success' : 'error'}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
