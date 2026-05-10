import React, { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, LinearProgress, Alert, Paper, Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { uploadDataset } from '../api/client';
import { alpha } from '@mui/material/styles';

const ACCENT = '#0FD4A4';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ANALYSIS_ITEMS = [
  ['Type Inference', 'Detects boolean, integer, float, date, and string types with confidence scores'],
  ['Statistics', 'Mean, median, std dev, quartiles, skewness, kurtosis, and value distributions for every column'],
  ['Pattern Detection', 'Identifies email, phone, URL, IP address, postal code, and alphanumeric formats'],
  ['Quality Scores', 'Completeness, validity, consistency, and accuracy scored 0–100 at dataset level'],
  ['Anomaly Detection', 'IQR-based outlier detection flags suspicious values in numeric columns'],
  ['AI Documentation', 'Claude generates a structured dataset summary with field-level insights'],
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [profiling, setProfiling] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setError('Only CSV files are supported.');
      return;
    }
    setFile(f);
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProfiling(false);
    setError(null);
    setProgress(0);
    try {
      await uploadDataset(file, file.name.replace('.csv', ''), (p) => {
        setProgress(p);
        if (p === 100) setProfiling(true);
      });
      setDone(true);
      setTimeout(() => navigate('/datasets'), 1400);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProfiling(false);
    }
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 5 }}>
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
          Data Ingestion
        </Typography>
        <Typography variant="h4" sx={{ color: '#E2E6F0', mb: 1 }}>
          Upload a Dataset
        </Typography>
        <Typography variant="body2" sx={{ color: '#525C78', maxWidth: 500 }}>
          Upload a CSV file to automatically profile structure, detect data types,
          compute statistics, and assess data quality.
        </Typography>
      </Box>

      {/* Drop zone */}
      <Paper
        elevation={0}
        onClick={() => !file && !uploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        sx={{
          maxWidth: 540,
          border: `1.5px dashed ${
            dragging ? ACCENT : file ? alpha(ACCENT, 0.35) : 'rgba(255,255,255,0.1)'
          }`,
          borderRadius: '14px',
          p: '40px 32px',
          textAlign: 'center',
          cursor: file || uploading ? 'default' : 'pointer',
          background: dragging
            ? alpha(ACCENT, 0.05)
            : file
            ? alpha(ACCENT, 0.025)
            : 'rgba(255,255,255,0.012)',
          transition: 'all 0.18s ease',
          '&:hover': !file && !uploading
            ? {
                borderColor: alpha(ACCENT, 0.45),
                background: alpha(ACCENT, 0.03),
              }
            : {},
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {!file ? (
          <>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '13px',
                background: alpha(ACCENT, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 24, color: ACCENT }} />
            </Box>
            <Typography
              sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 600, color: '#E2E6F0', mb: 0.75, fontSize: '0.95rem' }}
            >
              Drop your CSV file here
            </Typography>
            <Typography variant="body2" sx={{ color: '#525C78', mb: 2.5 }}>
              or click to browse
            </Typography>
            <Chip
              label="CSV only"
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#3A4258' }}
            />
          </>
        ) : (
          <Box>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '11px',
                background: alpha(ACCENT, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <InsertDriveFileIcon sx={{ fontSize: 20, color: ACCENT }} />
            </Box>
            <Typography
              sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 600, color: '#E2E6F0', mb: 0.4, fontSize: '0.9rem' }}
            >
              {file.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#525C78' }}>
              {formatSize(file.size)}
            </Typography>
            {!uploading && (
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  sx={{ color: '#3A4258', fontSize: '0.75rem' }}
                  onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}
                >
                  Remove file
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Upload button */}
      {file && !uploading && !done && (
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleUpload} sx={{ px: 4, py: 1.1 }}>
            Profile Dataset
          </Button>
        </Box>
      )}

      {/* Progress */}
      {uploading && (
        <Box sx={{ maxWidth: 540, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#525C78' }}>
              {profiling ? 'Profiling dataset — this may take a moment…' : 'Uploading file…'}
            </Typography>
            {!profiling && (
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: ACCENT }}>
                {progress}%
              </Typography>
            )}
          </Box>
          <LinearProgress
            variant={profiling ? 'indeterminate' : 'determinate'}
            value={profiling ? undefined : progress}
            sx={{ '& .MuiLinearProgress-bar': { background: ACCENT }, '& .MuiLinearProgress-bar1Indeterminate': { background: ACCENT }, '& .MuiLinearProgress-bar2Indeterminate': { background: alpha(ACCENT, 0.4) } }}
          />
        </Box>
      )}

      {/* Done */}
      {done && (
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: ACCENT, fontSize: 17 }} />
          <Typography variant="body2" sx={{ color: ACCENT }}>
            Profiling complete — redirecting to datasets…
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{
            maxWidth: 540,
            mt: 3,
            bgcolor: 'rgba(255,78,110,0.07)',
            color: '#FF8FAB',
            border: '1px solid rgba(255,78,110,0.18)',
            '& .MuiAlert-icon': { color: '#FF4E6E' },
          }}
        >
          {error}
        </Alert>
      )}

      {/* What gets analyzed */}
      <Box sx={{ mt: 7, maxWidth: 540 }}>
        <Typography
          sx={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.62rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#2E3448',
            mb: 2.5,
          }}
        >
          What gets analyzed
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ANALYSIS_ITEMS.map(([title, desc]) => (
            <Box key={title} sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: alpha(ACCENT, 0.4),
                  mt: '6px',
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography
                  sx={{ color: '#5A6480', fontWeight: 600, fontSize: '0.8rem', mb: 0.2 }}
                >
                  {title}
                </Typography>
                <Typography sx={{ color: '#2E3448', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  {desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
