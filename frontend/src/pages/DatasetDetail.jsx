import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Tabs, Tab, Paper, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Alert, Skeleton, Tooltip, Collapse, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport } from '../api/client';
import { alpha } from '@mui/material/styles';

const ACCENT = '#0FD4A4';

const qualityColor = (score) => {
  if (score == null) return '#525C78';
  if (score >= 80) return '#0FD4A4';
  if (score >= 60) return '#FFB020';
  return '#FF4E6E';
};

const TYPE_CONFIG = {
  integer: { label: 'INT',   bg: 'rgba(91,142,240,0.1)',  color: '#5B8EF0' },
  float:   { label: 'FLOAT', bg: 'rgba(123,168,255,0.1)', color: '#7BA8FF' },
  string:  { label: 'STR',   bg: 'rgba(200,150,255,0.1)', color: '#C896FF' },
  boolean: { label: 'BOOL',  bg: 'rgba(255,176,32,0.1)',  color: '#FFB020' },
  date:    { label: 'DATE',  bg: 'rgba(15,212,164,0.1)',  color: '#0FD4A4' },
};

const fmt = (v, d = 2) => {
  if (v == null) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(d);
  return String(v);
};

const fmtPct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

function TypeChip({ type }) {
  const cfg = TYPE_CONFIG[type] || {
    label: (type || 'str').toUpperCase().slice(0, 5),
    bg: 'rgba(255,255,255,0.06)',
    color: '#525C78',
  };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontFamily: '"DM Mono", monospace',
        fontSize: '0.63rem',
        height: 20,
        borderRadius: '4px',
        fontWeight: 500,
      }}
    />
  );
}

function StatBlock({ label, value }) {
  return (
    <Box>
      <Typography
        sx={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.6rem',
          color: '#3A4258',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          mb: 0.4,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color: '#7A8AB0' }}>
        {value}
      </Typography>
    </Box>
  );
}

function parseJSON(v) {
  if (!v) return [];
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return []; }
  }
  return Array.isArray(v) ? v : [];
}

function ColumnRow({ col }) {
  const [open, setOpen] = useState(false);
  const topValues = parseJSON(col.top_values);
  const patterns = parseJSON(col.patterns);
  const isNum = ['integer', 'float'].includes(col.inferred_type);
  const isStr = col.inferred_type === 'string';

  return (
    <>
      <TableRow sx={{ cursor: 'pointer' }} onClick={() => setOpen((v) => !v)}>
        <TableCell sx={{ width: 32, pr: 0, pl: 1.5 }}>
          <IconButton size="small" sx={{ color: open ? ACCENT : '#2E3448', p: 0.25 }}>
            {open
              ? <ExpandLessIcon sx={{ fontSize: 14 }} />
              : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography
            sx={{
              fontFamily: '"DM Mono", monospace',
              fontWeight: 500,
              color: '#C8D0E8',
              fontSize: '0.82rem',
            }}
          >
            {col.column_name}
          </Typography>
        </TableCell>
        <TableCell><TypeChip type={col.inferred_type} /></TableCell>
        <TableCell align="right">
          <Typography
            sx={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.78rem',
              color: col.null_rate > 0.3 ? '#FF4E6E' : col.null_rate > 0.1 ? '#FFB020' : '#A0AABF',
            }}
          >
            {fmtPct(col.null_rate)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: '#A0AABF' }}>
            {fmt(col.distinct_count, 0)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: '#A0AABF' }}>
            {isNum
              ? fmt(col.mean)
              : isStr
              ? `${fmt(col.avg_length, 0)} ch`
              : '—'}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: '#A0AABF' }}>
            {isNum ? `${fmt(col.min_value)} – ${fmt(col.max_value)}` : '—'}
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.012)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                px: 5,
                py: 2.5,
              }}
            >
              {/* Numeric extended stats */}
              {isNum && (
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: topValues.length ? 2.5 : 0 }}>
                  <StatBlock label="Median" value={fmt(col.median)} />
                  <StatBlock label="Std Dev" value={fmt(col.std_dev)} />
                  <StatBlock label="Q1" value={fmt(col.q1)} />
                  <StatBlock label="Q3" value={fmt(col.q3)} />
                  {col.skewness != null && <StatBlock label="Skewness" value={fmt(col.skewness)} />}
                  {col.kurtosis != null && <StatBlock label="Kurtosis" value={fmt(col.kurtosis)} />}
                  {col.type_confidence != null && (
                    <StatBlock label="Confidence" value={`${(col.type_confidence * 100).toFixed(0)}%`} />
                  )}
                </Box>
              )}

              {/* String stats */}
              {isStr && (
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: topValues.length ? 2.5 : 0 }}>
                  <StatBlock label="Min Length" value={fmt(col.min_length, 0)} />
                  <StatBlock label="Max Length" value={fmt(col.max_length, 0)} />
                  <StatBlock label="Avg Length" value={fmt(col.avg_length, 1)} />
                  {col.type_confidence != null && (
                    <StatBlock label="Confidence" value={`${(col.type_confidence * 100).toFixed(0)}%`} />
                  )}
                </Box>
              )}

              {/* Top values */}
              {topValues.length > 0 && (
                <Box sx={{ mb: patterns.length ? 2 : 0 }}>
                  <Typography
                    sx={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.6rem',
                      color: '#3A4258',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      mb: 1,
                    }}
                  >
                    Top Values
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {topValues.slice(0, 8).map((item, i) => {
                      const val = item?.value ?? item?.[0] ?? item;
                      const cnt = item?.count ?? item?.[1] ?? '';
                      return (
                        <Chip
                          key={i}
                          label={cnt ? `${val} · ${cnt}` : String(val)}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.04)',
                            color: '#7A8AB0',
                            fontFamily: '"DM Mono", monospace',
                            fontSize: '0.67rem',
                            height: 22,
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Patterns */}
              {patterns.length > 0 && (
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.6rem',
                      color: '#3A4258',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      mb: 1,
                    }}
                  >
                    Detected Patterns
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {patterns.map((p, i) => (
                      <Chip
                        key={i}
                        label={String(p)}
                        size="small"
                        sx={{
                          bgcolor: alpha(ACCENT, 0.08),
                          color: ACCENT,
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '0.67rem',
                          height: 22,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Fallback when no expanded content */}
              {!isNum && !isStr && !topValues.length && !patterns.length && (
                <Typography sx={{ color: '#2E3448', fontSize: '0.78rem' }}>
                  No additional statistics available for this column type.
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function QualityBar({ label, score }) {
  const color = qualityColor(score);
  const value = score ?? 0;
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Typography sx={{ fontSize: '0.85rem', color: '#A0AABF', fontWeight: 500 }}>{label}</Typography>
        <Typography
          sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color, fontWeight: 600 }}
        >
          {score != null ? value.toFixed(1) : 'N/A'}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{ '& .MuiLinearProgress-bar': { background: color } }}
      />
    </Box>
  );
}

export default function DatasetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    getReport(id)
      .then(({ data }) => setReport(data))
      .catch(() => setError('Could not load dataset report. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.04)', mb: 3 }} />
        <Skeleton variant="rectangular" height={100} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
          onClick={() => navigate('/datasets')}
          sx={{ color: '#525C78', mb: 3 }}
        >
          Back
        </Button>
        <Alert
          severity="error"
          sx={{
            bgcolor: 'rgba(255,78,110,0.07)',
            color: '#FF8FAB',
            border: '1px solid rgba(255,78,110,0.18)',
            '& .MuiAlert-icon': { color: '#FF4E6E' },
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // API returns flat fields — normalise into a ds object for the template
  const ds = report
    ? {
        name: report.dataset_name,
        row_count: report.row_count,
        column_count: report.column_count,
        overall_quality_score: report.overall_quality_score,
        file_type: 'csv',
        status: 'profiled',
      }
    : null;
  const columns = [...(report?.columns ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
  const quality = report?.quality ?? null;
  const overallScore = report?.overall_quality_score ?? quality?.overall_score;
  const scoreColor = qualityColor(overallScore);

  return (
    <Box>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
        onClick={() => navigate('/datasets')}
        sx={{ color: '#525C78', mb: 3, fontWeight: 400 }}
      >
        All Datasets
      </Button>

      {/* Dataset header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
          flexWrap: 'wrap',
          gap: 3,
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
            Dataset Profile
          </Typography>
          <Typography variant="h4" sx={{ color: '#E2E6F0', mb: 1.5 }}>
            {ds?.name ?? 'Unnamed Dataset'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={`${(ds?.row_count ?? 0).toLocaleString()} rows`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#7A8AB0' }}
            />
            <Chip
              label={`${ds?.column_count ?? 0} columns`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#7A8AB0' }}
            />
            <Chip
              label={(ds?.file_type ?? 'csv').toUpperCase()}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#3A4258' }}
            />
            <Chip
              label={ds?.status ?? 'profiled'}
              size="small"
              sx={{ bgcolor: alpha(ACCENT, 0.1), color: ACCENT }}
            />
          </Box>
        </Box>

        {/* Overall quality ring */}
        {overallScore != null && (
          <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={76}
                thickness={3}
                sx={{ color: 'rgba(255,255,255,0.05)', position: 'absolute' }}
              />
              <CircularProgress
                variant="determinate"
                value={overallScore}
                size={76}
                thickness={3}
                sx={{ color: scoreColor }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: scoreColor,
                    lineHeight: 1,
                  }}
                >
                  {Math.round(overallScore)}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.52rem',
                    color: '#3A4258',
                    letterSpacing: '0.06em',
                    mt: 0.3,
                  }}
                >
                  QUALITY
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Tab label={`Columns (${columns.length})`} />
        <Tab label="Quality" />
      </Tabs>

      {/* Columns tab */}
      {tab === 0 && (
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 32 }} />
                <TableCell>Column</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Null %</TableCell>
                <TableCell align="right">Distinct</TableCell>
                <TableCell align="right">Mean / Avg Len</TableCell>
                <TableCell align="right">Range</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {columns.map((col) => (
                <ColumnRow key={col.id ?? col.column_name} col={col} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Quality tab */}
      {tab === 1 && (
        <Box sx={{ maxWidth: 500 }}>
          {quality ? (
            <Paper elevation={0} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <QualityBar label="Overall Quality" score={quality.overall_score ?? overallScore} />
                <QualityBar label="Completeness" score={quality.completeness_score} />
                <QualityBar label="Validity" score={quality.validity_score} />
                {quality.consistency_score != null && (
                  <QualityBar label="Consistency" score={quality.consistency_score} />
                )}
              </Box>

              {/* Issues breakdown */}
              {quality.issues && Object.keys(quality.issues).length > 0 && (
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography
                    sx={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.62rem',
                      color: '#3A4258',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      mb: 2,
                    }}
                  >
                    Issues Detected
                  </Typography>
                  {Object.entries(quality.issues).map(([key, val]) => (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 0.9,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <Typography sx={{ color: '#7A8AB0', fontSize: '0.82rem' }}>{key}</Typography>
                      <Typography sx={{ fontFamily: '"DM Mono", monospace', color: '#525C78', fontSize: '0.78rem' }}>
                        {String(val)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          ) : (
            <Alert
              severity="info"
              sx={{
                bgcolor: 'rgba(91,142,240,0.07)',
                color: '#7BA8FF',
                border: '1px solid rgba(91,142,240,0.18)',
                '& .MuiAlert-icon': { color: '#5B8EF0' },
              }}
            >
              Quality results are not available for this dataset.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
