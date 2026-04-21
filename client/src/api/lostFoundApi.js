import api from './axiosConfig';

const lostFoundApi = {
  /** Open items only — no auth (home page, public views). */
  listPublic: async (params = {}) => {
    const res = await api.get('/lost-found/public', { params });
    return res.data?.data || [];
  },

  list: async (params = {}) => {
    const res = await api.get('/lost-found', { params });
    return res.data?.data || [];
  },

  mine: async () => {
    const res = await api.get('/lost-found/mine');
    return res.data?.data || [];
  },

  create: async (payload) => {
    const form = new FormData();
    form.append('type', payload.type);
    form.append('itemName', payload.itemName);
    form.append('category', payload.category);
    form.append('description', payload.description ?? '');
    form.append('location', payload.location);
    form.append('date', payload.date);
    if (payload.contactInfo) form.append('contactInfo', payload.contactInfo);
    if (payload.additionalContact) form.append('additionalContact', payload.additionalContact);
    if (payload.image) form.append('image', payload.image);

    const res = await api.post('/lost-found', form);
    return res.data?.data || res.data;
  },

  claim: async (id) => {
    const res = await api.put(`/lost-found/${id}/claim`);
    return res.data?.data || res.data;
  },

  reportFound: async (id, data) => {
    const res = await api.put(`/lost-found/${id}/report-found`, data);
    return res.data?.data || res.data;
  }
};

export default lostFoundApi;

