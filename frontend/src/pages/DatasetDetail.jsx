import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Tabs, Tab, Paper, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Alert, Skeleton, Collapse, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  Cell, ResponsiveContainer,
} from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport } from '../api/client';
import { alpha } from '@mui/material/styles';

const ACCENT   = '#0FD4A4';
const AMBER    = '#FFB020';
const BLUE     = '#5B8EF0';

const qualityColor = (score) => {
  if (score == null) return '#525C78';
  if (score >= 80)   return ACCENT;
  if (score >= 60)   return AMBER;
  return '#FF4E6E';
};

const TYPE_CONFIG = {
  integer: { label: 'INT',   bg: 'rgba(91,142,240,0.1)',  color: BLUE },
  float:   { label: 'FLOAT', bg: 'rgba(123,168,255,0.1)', color: '#7BA8FF' },
  string:  { label: 'STR',   bg: 'rgba(200,150,255,0.1)', color: '#C896FF' },
  boolean: { label: 'BOOL',  bg: 'rgba(255,176,32,0.1)',  color: AMBER },
  date:    { label: 'DATE',  bg: 'rgba(15,212,164,0.1)',  color: ACCENT },
};

const fmt = (v, d = 2) => {
  if (v == null) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(d);
  const n = parseFloat(v);
  return isNaN(n) ? String(v) : (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(d));
};

const fmtPct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

const LABEL_SX = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.6rem',
  color: '#3A4258',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  mb: 1,
};

function parseJSON(v) {
  if (!v) return [];
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
  return Array.isArray(v) ? v : [];
}

/* ─── Type chip ─────────────────────────────────────────────── */
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
        bgcolor: cfg.bg, color: cfg.color,
        fontFamily: '"DM Mono", monospace',
        fontSize: '0.63rem', height: 20, borderRadius: '4px', fontWeight: 500,
      }}
    />
  );
}

/* ─── Stat block ─────────────────────────────────────────────── */
function StatBlock({ label, value }) {
  return (
    <Box>
      <Typography sx={LABEL_SX}>{label}</Typography>
      <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color: '#7A8AB0' }}>
        {value}
      </Typography>
    </Box>
  );
}

/* ─── Frequency bar chart ────────────────────────────────────── */
const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, count } = payload[0].payload;
  return (
    <Box sx={{
      bgcolor: '#1A1D2E',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      px: 1.5, py: 1,
    }}>
      <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', color: '#A0AABF', mb: 0.3 }}>
        {name}
      </Typography>
      <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color: ACCENT, fontWeight: 600 }}>
        {count.toLocaleString()} rows
      </Typography>
    </Box>
  );
};

function ValueDistributionChart({ topValues }) {
  const data = topValues.slice(0, 8).map((item) => ({
    name: String(item?.value ?? item?.[0] ?? '').slice(0, 22),
    count: Number(item?.count ?? item?.[1] ?? 0),
  }));
  if (!data.length) return null;

  const barHeight = 28;
  const chartH = data.length * barHeight + 24;

  return (
    <Box sx={{ mt: 0.5 }}>
      <Typography sx={LABEL_SX}>Value Distribution</Typography>
      <Box sx={{ width: '100%', height: chartH }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 12, bottom: 0, left: 4 }}
            barCategoryGap="20%"
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontFamily: '"DM Mono", monospace', fontSize: 9, fill: '#3A4258' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontFamily: '"DM Mono", monospace', fontSize: 10, fill: '#7A8AB0' }}
              width={110}
            />
            <RTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 0
                    ? ACCENT
                    : `rgba(15,212,164,${Math.max(0.55 - i * 0.06, 0.18)})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

/* ─── Numeric range visualiser (box-plot style) ──────────────── */
function NumericRangeViz({ col }) {
  const min = parseFloat(col.min_value);
  const max = parseFloat(col.max_value);
  if (isNaN(min) || isNaN(max) || max === min) return null;

  const pct = (v) => (((v - min) / (max - min)) * 100).toFixed(2);
  const q1   = col.q1   != null ? parseFloat(col.q1)     : null;
  const q3   = col.q3   != null ? parseFloat(col.q3)     : null;
  const med  = col.median != null ? parseFloat(col.median) : null;
  const mean = col.mean   != null ? parseFloat(col.mean)   : null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={LABEL_SX}>Distribution Range</Typography>

      {/* Track */}
      <Box sx={{ position: 'relative', height: 28, mx: 1 }}>
        {/* Background rail */}
        <Box sx={{
          position: 'absolute', top: '11px', bottom: '11px', left: 0, right: 0,
          bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '4px',
        }} />

        {/* IQR box (Q1 → Q3) */}
        {q1 != null && q3 != null && (
          <Box sx={{
            position: 'absolute',
            top: '6px', bottom: '6px',
            left: `${pct(q1)}%`,
            width: `${pct(q3) - pct(q1)}%`,
            bgcolor: alpha(ACCENT, 0.18),
            border: `1px solid ${alpha(ACCENT, 0.35)}`,
            borderRadius: '3px',
          }} />
        )}

        {/* Median line */}
        {med != null && (
          <Box sx={{
            position: 'absolute', top: 2, bottom: 2,
            left: `${pct(med)}%`,
            width: '2px',
            bgcolor: ACCENT, borderRadius: '2px',
            transform: 'translateX(-1px)',
          }} />
        )}

        {/* Mean dot */}
        {mean != null && (
          <Box sx={{
            position: 'absolute', top: '50%',
            left: `${pct(mean)}%`,
            transform: 'translate(-50%, -50%)',
            width: 7, height: 7,
            borderRadius: '50%',
            bgcolor: AMBER,
            boxShadow: `0 0 0 2px rgba(255,176,32,0.25)`,
            zIndex: 2,
          }} />
        )}

        {/* Min cap */}
        <Box sx={{
          position: 'absolute', top: '7px', bottom: '7px',
          left: 0, width: '2px',
          bgcolor: '#3A4258', borderRadius: '2px',
        }} />

        {/* Max cap */}
        <Box sx={{
          position: 'absolute', top: '7px', bottom: '7px',
          right: 0, width: '2px',
          bgcolor: '#3A4258', borderRadius: '2px',
        }} />
      </Box>

      {/* Min / legend / Max labels */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.75, mx: 1 }}>
        <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#525C78' }}>
          {fmt(min)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {med != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 2, bgcolor: ACCENT, borderRadius: 1 }} />
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: '#525C78' }}>
                median {fmt(med)}
              </Typography>
            </Box>
          )}
          {mean != null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: AMBER }} />
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', color: '#525C78' }}>
                mean {fmt(mean)}
              </Typography>
            </Box>
          )}
        </Box>
        <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#525C78' }}>
          {fmt(max)}
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Anomaly section ────────────────────────────────────────── */
function AnomalyDetail({ anomaly }) {
  if (!anomaly || anomaly.outlier_count === 0) return null;
  return (
    <Box sx={{
      mt: 2.5,
      p: 2,
      bgcolor: 'rgba(255,176,32,0.04)',
      border: '1px solid rgba(255,176,32,0.18)',
      borderRadius: '8px',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <WarningAmberIcon sx={{ fontSize: 14, color: AMBER }} />
        <Typography sx={{
          fontFamily: '"DM Mono", monospace', fontSize: '0.65rem',
          color: AMBER, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
        }}>
          {anomaly.outlier_count} outlier{anomaly.outlier_count !== 1 ? 's' : ''} detected — {anomaly.outlier_pct}% of values
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <StatBlock label="Method"      value={anomaly.method} />
        <StatBlock label="Lower Bound" value={fmt(anomaly.lower_bound)} />
        <StatBlock label="Upper Bound" value={fmt(anomaly.upper_bound)} />
        <StatBlock label="Below Bound" value={anomaly.low_outliers} />
        <StatBlock label="Above Bound" value={anomaly.high_outliers} />
      </Box>
    </Box>
  );
}

/* ─── Column row ─────────────────────────────────────────────── */
function ColumnRow({ col, anomaly }) {
  const [open, setOpen] = useState(false);
  const topValues = parseJSON(col.top_values);
  const patterns  = parseJSON(col.patterns);
  const isNum = ['integer', 'float'].includes(col.inferred_type);
  const isStr = col.inferred_type === 'string';
  const hasAnomaly = anomaly && anomaly.outlier_count > 0;

  return (
    <>
      <TableRow sx={{ cursor: 'pointer' }} onClick={() => setOpen((v) => !v)}>
        <TableCell sx={{ width: 32, pr: 0, pl: 1.5 }}>
          <IconButton size="small" sx={{ color: open ? ACCENT : '#2E3448', p: 0.25 }}>
            {open ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontFamily: '"DM Mono", monospace', fontWeight: 500, color: '#C8D0E8', fontSize: '0.82rem' }}>
              {col.column_name}
            </Typography>
            {hasAnomaly && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4,
                bgcolor: 'rgba(255,176,32,0.1)', borderRadius: '4px', px: 0.6, py: 0.2 }}>
                <WarningAmberIcon sx={{ fontSize: 10, color: AMBER }} />
                <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: AMBER, fontWeight: 600 }}>
                  {anomaly.outlier_count}
                </Typography>
              </Box>
            )}
          </Box>
        </TableCell>
        <TableCell><TypeChip type={col.inferred_type} /></TableCell>
        <TableCell align="right">
          <Typography sx={{
            fontFamily: '"DM Mono", monospace', fontSize: '0.78rem',
            color: col.null_rate > 0.3 ? '#FF4E6E' : col.null_rate > 0.1 ? AMBER : '#A0AABF',
          }}>
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
            {isNum ? fmt(col.mean) : isStr ? `${fmt(col.avg_length, 0)} ch` : '—'}
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
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.012)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              px: 5, py: 3,
            }}>

              {/* Numeric extended stats */}
              {isNum && (
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2.5 }}>
                  <StatBlock label="Median"    value={fmt(col.median)} />
                  <StatBlock label="Std Dev"   value={fmt(col.std_dev)} />
                  <StatBlock label="Q1"        value={fmt(col.q1)} />
                  <StatBlock label="Q3"        value={fmt(col.q3)} />
                  {col.skewness  != null && <StatBlock label="Skewness"   value={fmt(col.skewness)} />}
                  {col.kurtosis  != null && <StatBlock label="Kurtosis"   value={fmt(col.kurtosis)} />}
                  {col.type_confidence != null && (
                    <StatBlock label="Confidence" value={`${(col.type_confidence * 100).toFixed(0)}%`} />
                  )}
                </Box>
              )}

              {/* String stats */}
              {isStr && (
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2.5 }}>
                  <StatBlock label="Min Length" value={fmt(col.min_length, 0)} />
                  <StatBlock label="Max Length" value={fmt(col.max_length, 0)} />
                  <StatBlock label="Avg Length" value={fmt(col.avg_length, 1)} />
                  {col.type_confidence != null && (
                    <StatBlock label="Confidence" value={`${(col.type_confidence * 100).toFixed(0)}%`} />
                  )}
                </Box>
              )}

              {/* Numeric distribution range visualiser */}
              {isNum && <NumericRangeViz col={col} />}

              {/* Anomaly detection results */}
              <AnomalyDetail anomaly={anomaly} />

              {/* Value frequency bar chart */}
              {topValues.length > 0 && <ValueDistributionChart topValues={topValues} />}

              {/* Detected patterns */}
              {patterns.length > 0 && (
                <Box sx={{ mt: topValues.length ? 2.5 : 0 }}>
                  <Typography sx={LABEL_SX}>Detected Patterns</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {patterns.map((p, i) => (
                      <Chip
                        key={i}
                        label={String(p)}
                        size="small"
                        sx={{
                          bgcolor: alpha(ACCENT, 0.08), color: ACCENT,
                          fontFamily: '"DM Mono", monospace', fontSize: '0.67rem', height: 22,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

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

/* ─── Quality bar ────────────────────────────────────────────── */
function QualityBar({ label, score }) {
  const color = qualityColor(score);
  const value = score ?? 0;
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Typography sx={{ fontSize: '0.85rem', color: '#A0AABF', fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color, fontWeight: 600 }}>
          {score != null ? value.toFixed(1) : 'N/A'}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={value}
        sx={{ '& .MuiLinearProgress-bar': { background: color } }} />
    </Box>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function DatasetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState(0);

  useEffect(() => {
    setLoading(true);
    getReport(id)
      .then(({ data }) => setReport(data))
      .catch(() => setError('Could not load dataset report. Make sure the backend is running.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.04)', mb: 3 }} />
      <Skeleton variant="rectangular" height={100} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, mb: 3 }} />
      <Skeleton variant="rectangular" height={40}  sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1, mb: 2 }} />
      <Skeleton variant="rectangular" height={300} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }} />
    </Box>
  );

  if (error) return (
    <Box>
      <Button startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
        onClick={() => navigate('/datasets')} sx={{ color: '#525C78', mb: 3 }}>
        Back
      </Button>
      <Alert severity="error" sx={{
        bgcolor: 'rgba(255,78,110,0.07)', color: '#FF8FAB',
        border: '1px solid rgba(255,78,110,0.18)',
        '& .MuiAlert-icon': { color: '#FF4E6E' },
      }}>
        {error}
      </Alert>
    </Box>
  );

  const ds = report ? {
    name: report.dataset_name,
    row_count: report.row_count,
    column_count: report.column_count,
    overall_quality_score: report.overall_quality_score,
    file_type: 'csv',
    status: 'profiled',
  } : null;

  const columns      = [...(report?.columns ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const quality      = report?.quality ?? null;
  const anomalies    = quality?.anomalies ?? {};
  const overallScore = report?.overall_quality_score ?? quality?.overall_score;
  const scoreColor  = qualityColor(overallScore);

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
        onClick={() => navigate('/datasets')} sx={{ color: '#525C78', mb: 3, fontWeight: 400 }}>
        All Datasets
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 3 }}>
        <Box>
          <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, mb: 1 }}>
            Dataset Profile
          </Typography>
          <Typography variant="h4" sx={{ color: '#E2E6F0', mb: 1.5 }}>
            {ds?.name ?? 'Unnamed Dataset'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip label={`${(ds?.row_count ?? 0).toLocaleString()} rows`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#7A8AB0' }} />
            <Chip label={`${ds?.column_count ?? 0} columns`}             size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#7A8AB0' }} />
            <Chip label={(ds?.file_type ?? 'csv').toUpperCase()}          size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: '#3A4258' }} />
            <Chip label={ds?.status ?? 'profiled'}                        size="small" sx={{ bgcolor: alpha(ACCENT, 0.1), color: ACCENT }} />
          </Box>
        </Box>

        {overallScore != null && (
          <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress variant="determinate" value={100} size={76} thickness={3}
                sx={{ color: 'rgba(255,255,255,0.05)', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={overallScore} size={76} thickness={3}
                sx={{ color: scoreColor }} />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '1.15rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                  {Math.round(overallScore)}
                </Typography>
                <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.52rem', color: '#3A4258', letterSpacing: '0.06em', mt: 0.3 }}>
                  QUALITY
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
                <ColumnRow key={col.id ?? col.column_name} col={col} anomaly={anomalies[col.column_name]} />
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
                <QualityBar label="Overall Quality"  score={quality.overall_score ?? overallScore} />
                <QualityBar label="Completeness"     score={quality.completeness_score} />
                <QualityBar label="Validity"         score={quality.validity_score} />
                {quality.consistency_score != null && (
                  <QualityBar label="Consistency" score={quality.consistency_score} />
                )}
              </Box>

              {quality.issues && Object.keys(quality.issues).length > 0 && (
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography sx={{ ...LABEL_SX, mb: 2 }}>Issues Detected</Typography>
                  {Object.entries(quality.issues).map(([key, val]) => (
                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.9, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Typography sx={{ color: '#7A8AB0', fontSize: '0.82rem' }}>{key}</Typography>
                      <Typography sx={{ fontFamily: '"DM Mono", monospace', color: '#525C78', fontSize: '0.78rem' }}>{String(val)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {Object.keys(anomalies).length > 0 && (
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WarningAmberIcon sx={{ fontSize: 14, color: AMBER }} />
                    <Typography sx={{ ...LABEL_SX, mb: 0, color: AMBER }}>
                      Anomalies Detected ({Object.keys(anomalies).length} column{Object.keys(anomalies).length !== 1 ? 's' : ''})
                    </Typography>
                  </Box>
                  {Object.entries(anomalies).map(([colName, a]) => (
                    <Box key={colName} sx={{
                      mb: 1.5, p: 2,
                      bgcolor: 'rgba(255,176,32,0.03)',
                      border: '1px solid rgba(255,176,32,0.12)',
                      borderRadius: '8px',
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: '#C8D0E8', fontWeight: 500 }}>
                          {colName}
                        </Typography>
                        <Chip
                          label={`${a.outlier_count} outlier${a.outlier_count !== 1 ? 's' : ''} (${a.outlier_pct}%)`}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,176,32,0.1)', color: AMBER, fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', height: 20 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <StatBlock label="Lower Bound" value={fmt(a.lower_bound)} />
                        <StatBlock label="Upper Bound" value={fmt(a.upper_bound)} />
                        <StatBlock label="Below" value={a.low_outliers} />
                        <StatBlock label="Above" value={a.high_outliers} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          ) : (
            <Alert severity="info" sx={{
              bgcolor: 'rgba(91,142,240,0.07)', color: '#7BA8FF',
              border: '1px solid rgba(91,142,240,0.18)',
              '& .MuiAlert-icon': { color: BLUE },
            }}>
              Quality results are not available for this dataset.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
