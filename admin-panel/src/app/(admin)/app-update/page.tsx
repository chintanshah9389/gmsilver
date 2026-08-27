'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { appConfigApi } from '@/lib/api';

type FormState = {
  androidLatestVersionName: string;
  androidLatestVersionCode: string;
  androidMinVersionCode: string;
  androidApkUrl: string;
  androidForceUpdate: boolean;
  iosLatestVersionName: string;
  iosStoreUrl: string;
  iosForceUpdate: boolean;
  message: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  androidLatestVersionName: '1.0.0',
  androidLatestVersionCode: '1',
  androidMinVersionCode: '1',
  androidApkUrl: '',
  androidForceUpdate: false,
  iosLatestVersionName: '1.0.0',
  iosStoreUrl: '',
  iosForceUpdate: false,
  message:
    'A new version of GM Silver is available. Please update to continue.',
  enabled: true,
};

export default function AppUpdatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await appConfigApi.getAdmin();
      const data = res.data.data;
      setForm({
        androidLatestVersionName: data.androidLatestVersionName || '1.0.0',
        androidLatestVersionCode: String(data.androidLatestVersionCode ?? 1),
        androidMinVersionCode: String(data.androidMinVersionCode ?? 1),
        androidApkUrl: data.androidApkUrl || '',
        androidForceUpdate: Boolean(data.androidForceUpdate),
        iosLatestVersionName: data.iosLatestVersionName || '1.0.0',
        iosStoreUrl: data.iosStoreUrl || '',
        iosForceUpdate: Boolean(data.iosForceUpdate),
        message:
          data.message ||
          'A new version of GM Silver is available. Please update to continue.',
        enabled: data.enabled ?? true,
      });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load app update config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    const latestCode = parseInt(form.androidLatestVersionCode, 10);
    const minCode = parseInt(form.androidMinVersionCode, 10);
    if (!Number.isFinite(latestCode) || latestCode < 1) {
      toast.error('Android latest version code must be a positive number');
      return;
    }
    if (!Number.isFinite(minCode) || minCode < 1) {
      toast.error('Android min version code must be a positive number');
      return;
    }
    if (!form.androidLatestVersionName.trim()) {
      toast.error('Android version name is required');
      return;
    }

    setSaving(true);
    try {
      await appConfigApi.update({
        androidLatestVersionName: form.androidLatestVersionName.trim(),
        androidLatestVersionCode: latestCode,
        androidMinVersionCode: minCode,
        androidApkUrl: form.androidApkUrl.trim() || null,
        androidForceUpdate: form.androidForceUpdate,
        iosLatestVersionName: form.iosLatestVersionName.trim() || '1.0.0',
        iosStoreUrl: form.iosStoreUrl.trim() || null,
        iosForceUpdate: form.iosForceUpdate,
        message: form.message.trim(),
        enabled: form.enabled,
      });
      toast.success('App update settings saved');
      fetchConfig();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          background:
            'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
          border: '1px solid rgba(192,192,192,0.08)',
          borderRadius: 3,
          p: 3,
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          App Update
        </Typography>
        <Typography variant="body2" color="text.secondary">
          When you publish a new Android APK, bump the version code here and paste
          the download URL. Users on older builds will see an update popup.
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 720 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.enabled}
                disabled={loading}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enabled: e.target.checked }))
                }
              />
            }
            label="Enable update checks"
          />

          <Typography variant="subtitle1" fontWeight={600}>
            Android (APK)
          </Typography>
          <TextField
            label="Latest version name"
            value={form.androidLatestVersionName}
            disabled={loading}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                androidLatestVersionName: e.target.value,
              }))
            }
            helperText="Must match versionName in android/app/build.gradle (e.g. 1.0.1)"
          />
          <TextField
            label="Latest version code"
            type="number"
            value={form.androidLatestVersionCode}
            disabled={loading}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                androidLatestVersionCode: e.target.value,
              }))
            }
            helperText="Must match versionCode in build.gradle. Popup shows if installed code is lower."
          />
          <TextField
            label="Minimum version code (force below this)"
            type="number"
            value={form.androidMinVersionCode}
            disabled={loading}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                androidMinVersionCode: e.target.value,
              }))
            }
          />
          <TextField
            label="APK download URL"
            value={form.androidApkUrl}
            disabled={loading}
            onChange={(e) =>
              setForm((f) => ({ ...f, androidApkUrl: e.target.value }))
            }
            placeholder="https://.../gmsilver-1.0.1.apk"
            helperText="Public direct link to the APK (R2, Drive, etc.)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.androidForceUpdate}
                disabled={loading}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    androidForceUpdate: e.target.checked,
                  }))
                }
              />
            }
            label="Force update (no Later button)"
          />

          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
            iOS (optional)
          </Typography>
          <TextField
            label="Latest iOS version name"
            value={form.iosLatestVersionName}
            disabled={loading}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                iosLatestVersionName: e.target.value,
              }))
            }
          />
          <TextField
            label="App Store / TestFlight URL"
            value={form.iosStoreUrl}
            disabled={loading}
            onChange={(e) =>
              setForm((f) => ({ ...f, iosStoreUrl: e.target.value }))
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.iosForceUpdate}
                disabled={loading}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    iosForceUpdate: e.target.checked,
                  }))
                }
              />
            }
            label="Force iOS update"
          />

          <TextField
            label="Popup message"
            value={form.message}
            disabled={loading}
            multiline
            minRows={2}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
          />

          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
