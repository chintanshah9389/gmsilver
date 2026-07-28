'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type FormData = yup.InferType<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await authApi.login(data.email, data.password);
      const { accessToken, refreshToken, user } = response.data.data;

      if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
        toast.error('Access denied. Admin or Owner account required.');
        return;
      }

      Cookies.set('accessToken', accessToken, { secure: true, sameSite: 'strict' });
      Cookies.set('refreshToken', refreshToken, { secure: true, sameSite: 'strict' });
      Cookies.set('user', JSON.stringify(user), { secure: true, sameSite: 'strict' });

      router.push('/dashboard');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Login failed. Please try again.'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at 50% 50%, rgba(192,192,192,0.05) 0%, #0A0A0F 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          mx: 2,
          background: 'rgba(18,18,26,0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(192,192,192,0.12)',
        }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              fontSize: 28,
              fontWeight: 700,
              color: '#0A0A0F',
            }}
          >
            GS
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            GM Silver Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sign in to manage your platform
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)',
              color: '#0A0A0F',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #E0E0E0 0%, #C0C0C0 100%)',
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} sx={{ color: '#0A0A0F' }} />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
