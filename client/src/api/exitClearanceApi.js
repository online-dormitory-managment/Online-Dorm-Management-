import api from './axiosConfig';

const exitClearanceApi = {
  request: async (items, studentId = null) => {
    const res = await api.post('/exit-clearance/request', { items, studentId });
    return res.data;
  },
  myRequests: async () => {
    const res = await api.get('/exit-clearance/my-requests');
    return res.data;
  },
  pending: async () => {
    const res = await api.get('/exit-clearance/pending');
    return res.data;
  },
  approve: async (id) => {
    const res = await api.put(`/exit-clearance/${id}/approve`);
    return res.data;
  },
  reject: async (id, rejectionReason) => {
    const res = await api.put(`/exit-clearance/${id}/reject`, { rejectionReason });
    return res.data;
  },
  getStatus: async (id) => {
    const res = await api.get(`/exit-clearance/${id}/status`);
    return res.data;
  },
  update: async (id, items) => {
    const res = await api.put(`/exit-clearance/${id}`, { items });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/exit-clearance/${id}`);
    return res.data;
  }
};


export default exitClearanceApi;

