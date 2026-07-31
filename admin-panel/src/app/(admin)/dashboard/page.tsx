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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <Box>
      {/* Premium Welcome Banner */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.12) 0%, rgba(255,215,0,0.04) 50%, rgba(10,10,15,0) 100%)',
        border: '1px solid rgba(192,192,192,0.1)',
        borderRadius: 3, p: 3, mb: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 1, mb: 0.5 }}>
            {greeting.toUpperCase()}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{
            background: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            GM Silver Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`${data.users.pending} Users Pending`} color="warning" size="small" />
          <Chip label={`${data.orders.pending} Orders Pending`} color="warning" size="small" />
          <Chip
            label={`${data.revenue.growth >= 0 ? '+' : ''}${data.revenue.growth.toFixed(1)}% Growth`}
            color={data.revenue.growth >= 0 ? 'success' : 'error'} size="small"
          />
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Total Products" value={data.products.total} subtitle={`${data.products.active} active`} icon={<Inventory />} color="#C0C0C0" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Categories" value={data.categories} icon={<Category />} color="#FFD700" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Total Users" value={data.users.total} subtitle={`${data.users.pending} pending`} icon={<People />} color="#64B5F6" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="This Month Revenue" value={`₹${data.revenue.thisMonth.toLocaleString()}`} subtitle={`vs ₹${data.revenue.lastMonth.toLocaleString()} last month`} icon={<CurrencyRupee />} color={data.revenue.growth >= 0 ? '#4CAF50' : '#FF4C4C'} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Total Orders" value={data.orders.total} icon={<ShoppingCart />} color="#4CAF50" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Pending Orders" value={data.orders.pending} icon={<Pending />} color="#FFB347" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Approved Orders" value={data.orders.approved} icon={<TrendingUp />} color="#64B5F6" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard title="Completed Orders" value={data.orders.completed} icon={<ShoppingCart />} color="#4CAF50" />
        </Grid>
      </Grid>
    </Box>
  );
}
