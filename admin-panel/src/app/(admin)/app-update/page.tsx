'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  MenuItem,
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
  androidDistributionMode: 'DIRECT_APK' | 'PLAY_STORE';
  androidPlayStoreUrl: string;
  androidForceUpdate: boolean;
  iosLatestVersionName: string;
  iosStoreUrl: string;
  iosForceUpdate: boolean;
  message: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  androidLatestVersionName: '1.0.1',
  androidLatestVersionCode: '2',
  androidMinVersionCode: '1',
  androidApkUrl: '',
  androidDistributionMode: 'DIRECT_APK',
  androidPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.gmsilver.app',
  androidForceUpdate: false,
  iosLatestVersionName: '1.0.0',
  iosStoreUrl: '',
  iosForceUpdate: false,
  message:
    'A new version of GM Silver is available. Please download and install the latest APK.',
  enabled: true,
};

export default function AppUpdatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        androidDistributionMode:
          data.androidDistributionMode === 'PLAY_STORE'
            ? 'PLAY_STORE'
            : 'DIRECT_APK',
        androidPlayStoreUrl:
          data.androidPlayStoreUrl ||
          'https://play.google.com/store/apps/details?id=com.gmsilver.app',
        androidForceUpdate: Boolean(data.androidForceUpdate),
        iosLatestVersionName: data.iosLatestVersionName || '1.0.0',
        iosStoreUrl: data.iosStoreUrl || '',
        iosForceUpdate: Boolean(data.iosForceUpdate),
        message:
          data.message ||
          'A new version of GM Silver is available. Please download and install the latest APK.',
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
    if (
      form.androidDistributionMode === 'PLAY_STORE' &&
      !form.androidPlayStoreUrl.trim()
    ) {
      toast.error('Play Store URL is required in Play Store mode');
      return;
    }

    setSaving(true);
    try {
      await appConfigApi.update({
        androidLatestVersionName: form.androidLatestVersionName.trim(),
        androidLatestVersionCode: latestCode,
        androidMinVersionCode: minCode,
        androidApkUrl: form.androidApkUrl.trim() || null,
        androidDistributionMode: form.androidDistributionMode,
        androidPlayStoreUrl: form.androidPlayStoreUrl.trim() || null,
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

  const handleUploadApk = async () => {
    if (!apkFile) {
      toast.error('Choose an APK file first');
      return;
    }
    const latestCode = parseInt(form.androidLatestVersionCode, 10);
    if (!Number.isFinite(latestCode) || latestCode < 1) {
      toast.error('Set a valid latest version code before uploading');
      return;
    }

    const body = new FormData();
    body.append('file', apkFile);
    body.append('versionName', form.androidLatestVersionName.trim());
    body.append('versionCode', String(latestCode));
    body.append('minVersionCode', form.androidMinVersionCode);
    body.append('forceUpdate', String(form.androidForceUpdate));
    body.append('message', form.message.trim());

    setUploading(true);
    try {
      await appConfigApi.uploadApk(body);
      toast.success('APK uploaded (replaced previous). Download link is set.');
      setApkFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchConfig();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'APK upload failed');
    } finally {
      setUploading(false);
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
          Upload the latest APK after each release (replaces the previous file).
          Users on older builds see an update popup. When you publish on Play
          Store, switch distribution mode to Play Store.
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
            label="Enable update popup"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            Off = no update dialog on app open. On = check for newer builds.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={form.androidForceUpdate}
                disabled={loading || !form.enabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    androidForceUpdate: e.target.checked,
                  }))
                }
              />
            }
            label="Update required (force)"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            Off = soft update (Later + Download). On = Update Required (no Later).
          </Typography>

          <Typography variant="subtitle1" fontWeight={600}>
            Android release
          </Typography>

          <TextField
            select
            label="Distribution mode"
            value={form.androidDistributionMode}
            disabled={loading}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                androidDistributionMode: e.target.value as
                  | 'DIRECT_APK'
                  | 'PLAY_STORE',
              }))
            }
            helperText={
              form.androidDistributionMode === 'PLAY_STORE'
                ? 'Update button opens Play Store'
                : 'Update button downloads the hosted APK'
            }
          >
            <MenuItem value="DIRECT_APK">Direct APK download</MenuItem>
            <MenuItem value="PLAY_STORE">Google Play Store</MenuItem>
          </TextField>

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
            helperText="Must match versionName in android/app/build.gradle"
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
            helperText="Must match versionCode in build.gradle"
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

          {form.androidDistributionMode === 'DIRECT_APK' ? (
            <>
              <Box
                sx={{
                  border: '1px dashed rgba(192,192,192,0.35)',
                  borderRadius: 2,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Upload latest APK (replaces previous)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stored as one file on R2 via your Railway backend:
                  releases/gmsilver-latest.apk
                </Typography>
                <Button variant="outlined" component="label" disabled={loading || uploading}>
                  {apkFile ? apkFile.name : 'Choose APK file'}
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept=".apk,application/vnd.android.package-archive"
                    onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                  />
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUploadApk}
                  disabled={loading || uploading || !apkFile}
                >
                  {uploading ? 'Uploading…' : 'Upload & set download link'}
                </Button>
              </Box>

              <TextField
                label="Current APK download URL"
                value={form.androidApkUrl}
                disabled
                helperText="Filled automatically after upload (you can still Save other settings)"
              />
            </>
          ) : (
            <TextField
              label="Play Store URL"
              value={form.androidPlayStoreUrl}
              disabled={loading}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  androidPlayStoreUrl: e.target.value,
                }))
              }
              placeholder="https://play.google.com/store/apps/details?id=com.gmsilver.app"
            />
          )}

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
              disabled={loading || saving || uploading}
            >
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
