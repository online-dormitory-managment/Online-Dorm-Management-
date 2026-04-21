import api from './axiosConfig';

const orderApi = {
  place: async (listingId, quantity = 1, note = '') => {
    const res = await api.post('/orders', { listingId, quantity, note });
    return res.data?.data || res.data;
  },
  mine: async () => {
    const res = await api.get('/orders/mine');
    return res.data?.data || [];
  },
  vendorOrders: async () => {
    const res = await api.get('/orders/vendor');
    return res.data?.data || [];
  },
  accept: async (id) => {
    const res = await api.put(`/orders/${id}/accept`);
    return res.data;
  },
  cancel: async (id) => {
    const res = await api.put(`/orders/${id}/cancel`);
    return res.data;
  },
};

export default orderApi;
