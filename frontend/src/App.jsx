import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Layout from './components/Layout';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import DatasetDetail from './pages/DatasetDetail';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/datasets" replace />} />
            <Route path="upload" element={<Upload />} />
            <Route path="datasets" element={<Dashboard />} />
            <Route path="datasets/:id" element={<DatasetDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
