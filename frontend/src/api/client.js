import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

export const uploadDataset = (file, datasetName, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (datasetName) formData.append('dataset_name', datasetName);

  return api.post('/profile/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};

export const getDatasets = () => api.get('/datasets/');
export const getDataset = (id) => api.get(`/datasets/${id}`);
export const getReport = (id) => api.get(`/profile/${id}/report`);
export const deleteDataset = (id) => api.delete(`/datasets/${id}`);

export default api;
