import api from './axiosConfig';

const notificationApi = {
  my: async () => {
    const res = await api.get('/notifications/my');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/mark-all-read');
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
  clearAll: async () => {
    const res = await api.delete('/notifications/clear-all');
    return res.data;
  }
};

export default notificationApi;

