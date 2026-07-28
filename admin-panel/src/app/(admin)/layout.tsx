'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Divider,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  People,
  Category,
  Inventory,
  ShoppingCart,
  Receipt,
  Notifications,
  Analytics,
  Security,
  Menu as MenuIcon,
  ChevronLeft,
  TableChart,
  Logout,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, href: '/dashboard' },
  { label: 'Users', icon: <People />, href: '/users' },
  { label: 'Categories', icon: <Category />, href: '/categories' },
  { label: 'Products', icon: <Inventory />, href: '/products' },
  { label: 'Orders', icon: <ShoppingCart />, href: '/orders' },
  { label: 'Invoices', icon: <Receipt />, href: '/invoices' },
  { label: 'Notifications', icon: <Notifications />, href: '/notifications' },
  { label: 'Analytics', icon: <Analytics />, href: '/analytics' },
  { label: 'Audit Logs', icon: <Security />, href: '/audit-logs' },
  { label: 'Import/Export', icon: <TableChart />, href: '/excel' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(true);

  const userStr = Cookies.get('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    const refreshToken = Cookies.get('refreshToken');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'rgba(10,10,15,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(192,192,192,0.08)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen((prev) => !prev)}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#0A0A0F',
              }}
            >
              GS
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              GM Silver
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {user?.name}
            </Typography>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
                color: '#0A0A0F',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout} sx={{ color: 'text.secondary' }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: '#0E0E16',
            borderRight: '1px solid rgba(192,192,192,0.06)',
            mt: '64px',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', py: 1 }}>
          <List dense>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <ListItem key={item.href} disablePadding sx={{ mb: 0.5, px: 1 }}>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(192,192,192,0.1)',
                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                        '& .MuiListItemText-primary': {
                          color: 'primary.main',
                          fontWeight: 600,
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(192,192,192,0.06)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isActive ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'primary.main' : 'text.primary',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: 'margin 0.2s ease',
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          background: '#0A0A0F',
        }}
      >
        <Box sx={{ p: 3, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
