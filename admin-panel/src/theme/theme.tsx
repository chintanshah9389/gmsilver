'use client';

import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// GM Silver Premium Dark Theme
export const gmSilverTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C0C0C0',    // Silver
      light: '#E8E8E8',
      dark: '#A0A0A0',
      contrastText: '#0A0A0A',
    },
    secondary: {
      main: '#FFD700',    // Gold accent
      light: '#FFE44D',
      dark: '#C5A500',
      contrastText: '#0A0A0A',
    },
    background: {
      default: '#0A0A0F',
      paper: '#12121A',
    },
    error: { main: '#FF4C4C' },
    warning: { main: '#FFB347' },
    success: { main: '#4CAF50' },
    info: { main: '#64B5F6' },
    text: {
      primary: '#F0F0F0',
      secondary: '#A0A0B0',
    },
    divider: 'rgba(192,192,192,0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(192,192,192,0.2)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(192,192,192,0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(192,192,192,0.08)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(192,192,192,0.06)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(192,192,192,0.05)',
            borderBottom: '1px solid rgba(192,192,192,0.12)',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(192,192,192,0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#C0C0C0',
          backgroundColor: 'rgba(192,192,192,0.04)',
        },
      },
    },
  },
});

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={gmSilverTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
