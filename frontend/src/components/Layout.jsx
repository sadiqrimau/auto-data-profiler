import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  CircularProgress, Fade,
} from '@mui/material';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import { alpha } from '@mui/material/styles';

const SIDEBAR_WIDTH = 220;
const ACCENT = '#0FD4A4';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ─── Server wake-up overlay ─────────────────────────────────── */
function ServerWakeScreen({ elapsed }) {
  const dots = '.'.repeat((Math.floor(elapsed) % 3) + 1).padEnd(3, ' ');
  const pct  = Math.min((elapsed / 60) * 100, 95);

  return (
    <Fade in timeout={600}>
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        bgcolor: '#0B0D13',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        {/* Logo mark */}
        <Box sx={{
          width: 56, height: 56, borderRadius: '16px',
          background: `linear-gradient(135deg, ${ACCENT} 0%, #0AB38A 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 3,
          boxShadow: `0 0 40px ${alpha(ACCENT, 0.25)}`,
        }}>
          <TableChartIcon sx={{ fontSize: 26, color: '#0B0D13' }} />
        </Box>

        {/* Spinner */}
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3.5 }}>
          <CircularProgress
            variant="determinate" value={100} size={64} thickness={2}
            sx={{ color: 'rgba(255,255,255,0.05)', position: 'absolute' }}
          />
          <CircularProgress
            variant="determinate" value={pct} size={64} thickness={2}
            sx={{ color: ACCENT }}
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.75rem',
              fontWeight: 700, color: ACCENT,
            }}>
              {Math.floor(elapsed)}s
            </Typography>
          </Box>
        </Box>

        <Typography sx={{
          fontFamily: '"Sora", sans-serif', fontWeight: 700,
          fontSize: '1.1rem', color: '#E2E6F0', mb: 1,
        }}>
          Waking up server{dots}
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: '#525C78', maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
          The backend is on Render's free tier and spins down after inactivity.
          This usually takes up to 60 seconds.
        </Typography>

        {/* Progress bar */}
        <Box sx={{ mt: 4, width: 280, height: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${alpha(ACCENT, 0.6)}, ${ACCENT})`,
            borderRadius: 2,
            transition: 'width 1s linear',
          }} />
        </Box>
      </Box>
    </Fade>
  );
}

const NAV = [
  { label: 'Upload', path: '/upload', icon: <UploadFileIcon sx={{ fontSize: 17 }} /> },
  { label: 'Datasets', path: '/datasets', icon: <TableChartIcon sx={{ fontSize: 17 }} /> },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Server wake-up detection
  const [waking, setWaking]   = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cancelRef   = useRef(false);
  const showTimerRef = useRef(null);
  const tickRef      = useRef(null);

  useEffect(() => {
    cancelRef.current = false;

    const onAwake = () => {
      clearTimeout(showTimerRef.current);
      clearInterval(tickRef.current);
      if (!cancelRef.current) setWaking(false);
    };

    const ping = async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 9000);
        await fetch(`${BASE_URL}/health`, { signal: ctrl.signal });
        clearTimeout(t);
        onAwake();
      } catch {
        if (!cancelRef.current) setTimeout(ping, 4000);
      }
    };

    // Only show wake screen if server hasn't responded within 2 s
    showTimerRef.current = setTimeout(() => {
      if (!cancelRef.current) {
        setWaking(true);
        setElapsed(0);
        tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      }
    }, 2000);

    ping();

    return () => {
      cancelRef.current = true;
      clearTimeout(showTimerRef.current);
      clearInterval(tickRef.current);
    };
  }, []);

  if (waking) return <ServerWakeScreen elapsed={elapsed} />;

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
