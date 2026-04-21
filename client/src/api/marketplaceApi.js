import api from './axiosConfig';

const marketplaceApi = {
  listPublic: async (params = {}) => {
    const res = await api.get('/marketplace/public', { params });
    return res.data?.data || [];
  },
  mine: async () => {
    const res = await api.get('/marketplace/mine');
    return res.data?.data || [];
  },
  create: async (payload) => {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description || '');
    form.append('price', String(payload.price));
    if (payload.currency) form.append('currency', payload.currency);
    if (payload.category) form.append('category', payload.category);
    if (payload.condition) form.append('condition', payload.condition);
    if (payload.contactHint) form.append('contactHint', payload.contactHint);
    if (payload.stock) form.append('stock', String(payload.stock));
    if (payload.deliveryTime) form.append('deliveryTime', payload.deliveryTime);
    if (payload.image) form.append('image', payload.image);

    const res = await api.post('/marketplace', form);
    return res.data?.data || res.data;
  },
  remove: async (id) => {
    const res = await api.delete(`/marketplace/${id}`);
    return res.data;
  },
  restock: async (id) => {
    const res = await api.put(`/marketplace/${id}/restock`);
    return res.data;
  },
  markSold: async (id) => {
    const res = await api.put(`/marketplace/${id}/sold`);
    return res.data;
  },
};

export default marketplaceApi;
