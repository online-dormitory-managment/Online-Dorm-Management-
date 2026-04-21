import api from './axiosConfig';

function asArray(resData) {
  if (Array.isArray(resData)) return resData;
  if (resData?.data && Array.isArray(resData.data)) return resData.data;
  return [];
}

const eventApi = {
  list: async () => {
    const res = await api.get('/events');
    return asArray(res.data);
  },
  mine: async () => {
    const res = await api.get('/events/mine');
    return asArray(res.data?.data);
  },
  create: async (payload) => {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('date', payload.date);
    form.append('time', payload.time);
    form.append('location', payload.location);
    form.append('description', payload.description || '');
    form.append('category', payload.category || 'Other');
    if (payload.eventPosterID) form.append('eventPosterID', payload.eventPosterID);
    if (payload.image) form.append('image', payload.image);

    const res = await api.post('/events', form);
    return res.data;
  },
  update: async (id, payload) => {
    const form = new FormData();
    form.append('title', payload.title);
    if (payload.date) form.append('date', payload.date);
    if (payload.time) form.append('time', payload.time);
    if (payload.location) form.append('location', payload.location);
    if (payload.description) form.append('description', payload.description);
    if (payload.category) form.append('category', payload.category);
    if (payload.eventPosterID) form.append('eventPosterID', payload.eventPosterID);
    if (payload.image instanceof File) form.append('image', payload.image);

    const res = await api.put(`/events/${id}`, form);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  },
};

export default eventApi;
