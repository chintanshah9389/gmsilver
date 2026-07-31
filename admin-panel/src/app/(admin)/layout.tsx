'use client';

import React, { useEffect, useState } from 'react';
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
  ViewCarousel,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

const DRAWER_WIDTH = 256;

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',   icon: <Dashboard />,    href: '/dashboard' },
      { label: 'Analytics',   icon: <Analytics />,    href: '/analytics' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Categories',  icon: <Category />,     href: '/categories' },
      { label: 'Products',    icon: <Inventory />,    href: '/products' },
      { label: 'Banners',     icon: <ViewCarousel />, href: '/banners' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Users',       icon: <People />,       href: '/users' },
      { label: 'Orders',      icon: <ShoppingCart />, href: '/orders' },
      { label: 'Invoices',    icon: <Receipt />,      href: '/invoices' },
      { label: 'Notifications', icon: <Notifications />, href: '/notifications' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Audit Logs',  icon: <Security />,     href: '/audit-logs' },
      { label: 'Import/Export', icon: <TableChart />, href: '/excel' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);

  useEffect(() => {
    const userStr = Cookies.get('user');
    if (!userStr) return;
    try { setUser(JSON.parse(userStr)); } catch { /* noop */ }
  }, []);

  const handleLogout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    router.push('/login');
  };

  const DrawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo section */}
      <Box sx={{
        px: 2.5, py: 2.5, borderBottom: '1px solid rgba(192,192,192,0.07)',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#0A0A0F', flexShrink: 0,
          boxShadow: '0 0 12px rgba(192,192,192,0.3)',
        }}>GS</Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="primary.light" lineHeight={1.2}>
            GM Silver
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      {/* Nav groups */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(192,192,192,0.15)', borderRadius: 4 },
      }}>
        {navGroups.map((group) => (
          <Box key={group.label} sx={{ mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ px: 2.5, mb: 0.5, display: 'block', color: 'text.disabled', fontWeight: 700, letterSpacing: 1.5, fontSize: 10 }}
            >
              {group.label.toUpperCase()}
            </Typography>
            <List dense disablePadding>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <ListItem key={item.href} disablePadding sx={{ px: 1.5, mb: 0.25 }}>
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      sx={{
                        borderRadius: 2,
                        py: 0.9,
                        position: 'relative',
                        backgroundColor: isActive ? 'rgba(192,192,192,0.1)' : 'transparent',
                        borderLeft: isActive ? '3px solid #C0C0C0' : '3px solid transparent',
                        '&:hover': { backgroundColor: 'rgba(192,192,192,0.07)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: isActive ? 'primary.main' : 'text.secondary' }}>
                        {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: 13.5,
                          fontWeight: isActive ? 700 : 400,
                          color: isActive ? 'primary.light' : 'text.primary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            <Box sx={{ height: 8 }} />
          </Box>
        ))}
      </Box>

      {/* User footer */}
      <Box sx={{
        px: 2, py: 1.5, borderTop: '1px solid rgba(192,192,192,0.07)',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Avatar sx={{
          width: 32, height: 32, fontSize: 13, fontWeight: 700,
          background: 'linear-gradient(135deg, #C0C0C0 0%, #909090 100%)', color: '#0A0A0F',
        }}>
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>{user?.name || 'Admin'}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton onClick={handleLogout} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(192,192,192,0.06)',
        }}
      >
        <Toolbar sx={{ minHeight: 56, gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen((prev) => !prev)}
            sx={{ color: 'text.secondary', mr: 1 }}
            size="small"
          >
            {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>

          {/* Breadcrumb-style current page */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 0.3 }}>
              {navGroups.flatMap(g => g.items).find(i => i.href === pathname)?.label ?? 'Admin'}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: 1 }}>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: '#0D0D15',
            borderRight: '1px solid rgba(192,192,192,0.06)',
            overflowX: 'hidden',
          },
        }}
      >
        {DrawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: 'margin 0.2s ease',
          mt: '56px',
          minHeight: 'calc(100vh - 56px)',
          background: '#0A0A0F',
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
