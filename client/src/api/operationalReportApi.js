import api from './axiosConfig';

const operationalReportApi = {
  create: async (reportData) => {
    const res = await api.post('/operational-reports', reportData);
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/operational-reports');
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/operational-reports/${id}/status`, { status });
    return res.data;
  }
};

export default operationalReportApi;
