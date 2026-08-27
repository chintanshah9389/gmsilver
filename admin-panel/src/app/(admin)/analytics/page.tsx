'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, List, ListItem, ListItemText, Chip } from '@mui/material';
import { analyticsApi } from '@/lib/api';

export default function AnalyticsPage() {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [mostViewed, setMostViewed] = useState<any[]>([]);
  const [mostOrdered, setMostOrdered] = useState<any[]>([]);
  const [searchKeywords, setSearchKeywords] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [a, v, o, s] = await Promise.all([
        analyticsApi.getActiveUsers(),
        analyticsApi.getMostViewed(10),
        analyticsApi.getMostOrdered(10),
        analyticsApi.getSearchKeywords(),
      ]);
      setActiveUsers(a.data.data || []);
      setMostViewed(v.data.data || []);
      setMostOrdered(o.data.data || []);
      setSearchKeywords(s.data.data || []);
    })();
  }, []);

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(192,192,192,0.08) 0%, rgba(12,12,18,0) 60%)',
        border: '1px solid rgba(192,192,192,0.08)', borderRadius: 3, p: 3, mb: 3,
      }}>
        <Typography variant='h5' fontWeight={700}>Analytics</Typography>
        <Typography variant='body2' color='text.secondary'>Behavior insights, product traction, and activity</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant='h6' gutterBottom>Active Users (24h)</Typography>
            <List dense>
              {activeUsers.slice(0, 12).map((u: any, i: number) => (
                <ListItem key={i}><ListItemText primary={u.user?.name || 'Unknown'} secondary={u.user?.email || ''} /></ListItem>
              ))}
            </List>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant='h6' gutterBottom>Most Searched Keywords</Typography>
            <Box sx={{ display:'flex', flexWrap:'wrap', gap:1 }}>
              {searchKeywords.map((k: any, i: number) => (
                <Chip key={i} label={`${k.keyword || 'unknown'} (${k.count})`} />
              ))}
            </Box>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant='h6' gutterBottom>Most Viewed Products</Typography>
            <List dense>
              {mostViewed.map((p: any) => (
                <ListItem key={p.id}><ListItemText primary={p.name} /></ListItem>
              ))}
            </List>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant='h6' gutterBottom>Most Ordered Products</Typography>
            <List dense>
              {mostOrdered.map((p: any) => (
                <ListItem key={p.id}><ListItemText primary={p.name} secondary={`Ordered: ${p.totalOrdered || 0}`} /></ListItem>
              ))}
            </List>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
