import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, CircularProgress,
  Skeleton, Chip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useNavigate } from 'react-router-dom';
import { getDatasets, deleteDataset } from '../api/client';
import { alpha } from '@mui/material/styles';

const ACCENT = '#0FD4A4';

const qualityColor = (score) => {
  if (score == null) return '#525C78';
  if (score >= 80) return '#0FD4A4';
  if (score >= 60) return '#FFB020';
  return '#FF4E6E';
};

const qualityLabel = (score) => {
  if (score == null) return 'N/A';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
};

const formatDate = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const fmtNum = (n) => (n != null ? n.toLocaleString() : '—');

function QualityBadge({ score }) {
  const color = qualityColor(score);
  const label = qualityLabel(score);
  const value = score ?? 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={30}
          thickness={3.5}
          sx={{ color: 'rgba(255,255,255,0.06)', position: 'absolute' }}
        />
        <CircularProgress
          variant="determinate"
          value={value}
          size={30}
          thickness={3.5}
          sx={{ color }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{ fontSize: '0.55rem', fontFamily: '"DM Mono", monospace', fontWeight: 600, color }}
          >
            {Math.round(value)}
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: '0.78rem', color, fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getDatasets();
      setDatasets(data);
    } catch {
      setError('Could not load datasets. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteDataset(id);
      setDatasets((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 5,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: ACCENT,
              mb: 1,
            }}
          >
            Data Catalog
          </Typography>
          <Typography variant="h4" sx={{ color: '#E2E6F0' }}>
            Profiled Datasets
          </Typography>
          <Typography variant="body2" sx={{ color: '#525C78', mt: 0.5 }}>
            {!loading && datasets.length > 0
              ? `${datasets.length} dataset${datasets.length !== 1 ? 's' : ''} analyzed`
              : !loading
              ? 'No datasets yet'
              : ' '}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Tooltip title="Refresh">
            <IconButton
              onClick={load}
              size="small"
              sx={{ color: '#525C78', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', p: 0.75 }}
            >
              <RefreshIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/upload')}
          >
            Upload CSV
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: 'rgba(255,78,110,0.07)',
            color: '#FF8FAB',
            border: '1px solid rgba(255,78,110,0.18)',
            '& .MuiAlert-icon': { color: '#FF4E6E' },
          }}
          action={
            <Button size="small" sx={{ color: '#FF8FAB' }} onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading skeletons */}
      {loading && (
        <Box>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={54}
              sx={{ mb: '2px', borderRadius: i === 1 ? '10px 10px 0 0' : i === 4 ? '0 0 10px 10px' : 0, bgcolor: 'rgba(255,255,255,0.03)' }}
            />
          ))}
        </Box>
      )}

      {/* Empty state */}
      {!loading && datasets.length === 0 && !error && (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            border: '1px dashed rgba(255,255,255,0.07)',
            borderRadius: '14px',
          }}
        >
          <Box sx={{
            width: 48, height: 48, borderRadius: '13px',
            background: alpha(ACCENT, 0.08),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2.5,
          }}>
            <TableChartIcon sx={{ fontSize: 22, color: alpha(ACCENT, 0.5) }} />
          </Box>
          <Typography
            sx={{ fontFamily: '"Sora", sans-serif', color: '#5A6480', mb: 0.75, fontSize: '1rem', fontWeight: 600 }}
          >
            No datasets yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#2E3448', mb: 3.5 }}>
            Upload a CSV file to automatically profile it and assess data quality
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/upload')}
            sx={{ bgcolor: ACCENT, color: '#0B0D13', fontWeight: 600, '&:hover': { bgcolor: '#0bbf95' } }}
          >
            Upload Your First Dataset
          </Button>
        </Box>
      )}

      {/* Table */}
      {!loading && datasets.length > 0 && (
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dataset</TableCell>
                <TableCell align="right">Rows</TableCell>
                <TableCell align="right">Columns</TableCell>
                <TableCell>Quality</TableCell>
                <TableCell>Profiled</TableCell>
                <TableCell align="right" sx={{ width: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datasets.map((ds) => (
                <TableRow
                  key={ds.id}
                  onClick={() => navigate(`/datasets/${ds.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: qualityColor(ds.overall_quality_score),
                          flexShrink: 0,
                          opacity: 0.7,
                        }}
                      />
                      <Box>
                        <Typography
                          sx={{ fontWeight: 600, color: '#E2E6F0', fontSize: '0.875rem', mb: 0.2 }}
                        >
                          {ds.name}
                        </Typography>
                        <Chip
                          label={(ds.file_type || 'csv').toUpperCase()}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#3A4258', height: 17, fontSize: '0.62rem' }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', color: '#A0AABF' }}>
                      {fmtNum(ds.row_count)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', color: '#A0AABF' }}>
                      {fmtNum(ds.column_count)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <QualityBadge score={ds.overall_quality_score} />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#525C78' }}>
                      {formatDate(ds.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); navigate(`/datasets/${ds.id}`); }}
                          sx={{ color: '#525C78', '&:hover': { color: ACCENT } }}
                        >
                          <ArrowForwardIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete dataset">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(ds.id, ds.name, e)}
                          disabled={deleting === ds.id}
                          sx={{ color: '#525C78', '&:hover': { color: '#FF4E6E' } }}
                        >
                          {deleting === ds.id ? (
                            <CircularProgress size={13} sx={{ color: 'inherit' }} />
                          ) : (
                            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
