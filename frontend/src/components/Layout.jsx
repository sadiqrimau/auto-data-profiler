import React from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import { alpha } from '@mui/material/styles';

const SIDEBAR_WIDTH = 220;
const ACCENT = '#0FD4A4';

const NAV = [
  { label: 'Upload', path: '/upload', icon: <UploadFileIcon sx={{ fontSize: 17 }} /> },
  { label: 'Datasets', path: '/datasets', icon: <TableChartIcon sx={{ fontSize: 17 }} /> },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          bgcolor: '#0F1119',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '9px',
                background: `linear-gradient(135deg, ${ACCENT} 0%, #0AB38A 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TableChartIcon sx={{ fontSize: 16, color: '#0B0D13' }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Sora", sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  letterSpacing: '-0.02em',
                  color: '#E2E6F0',
                  lineHeight: 1.1,
                }}
              >
                DataProfiler
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.6rem',
                  color: '#2E3448',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  mt: 0.2,
                }}
              >
                Auto Analysis
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ mx: 2.5, mb: 2, height: '1px', bgcolor: 'rgba(255,255,255,0.05)' }} />

        {/* Nav */}
        <List sx={{ px: 1.5, flex: 1 }} disablePadding>
          {NAV.map(({ label, path, icon }) => {
            const active =
              location.pathname === path ||
              (path === '/datasets' && location.pathname.startsWith('/datasets'));
            return (
              <ListItemButton
                key={path}
                onClick={() => navigate(path)}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  py: 0.9,
                  px: 1.5,
                  color: active ? ACCENT : '#525C78',
                  background: active ? alpha(ACCENT, 0.08) : 'transparent',
                  '&:hover': {
                    background: active ? alpha(ACCENT, 0.1) : 'rgba(255,255,255,0.03)',
                    color: active ? ACCENT : '#A0AABF',
                  },
                  transition: 'all 0.12s ease',
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: active ? 600 : 400,
                    letterSpacing: '-0.01em',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <Typography
            sx={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.62rem',
              color: '#2E3448',
              letterSpacing: '0.04em',
            }}
          >
            v0.1.0 · Auto Data Profiler
          </Typography>
        </Box>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          minHeight: '100vh',
          p: { xs: 3, md: '40px 48px' },
          maxWidth: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
