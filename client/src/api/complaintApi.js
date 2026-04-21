import api from './axiosConfig';

const complaintApi = {
  submit: async (payload) => {
    const form = new FormData();
    form.append('category', payload.category);
    form.append('title', payload.title);
    form.append('description', payload.description);
    if (payload.priority) form.append('priority', payload.priority);
    if (payload.isAnonymous != null) form.append('isAnonymous', String(payload.isAnonymous));
    if (payload.attachment) form.append('attachment', payload.attachment);

    const res = await api.post('/complaints/submit', form);
    return res.data;
  },

  myComplaints: async () => {
    const res = await api.get('/complaints/my-complaints');
    return res.data;
  },

  blockComplaints: async () => {
    const res = await api.get('/complaints/block-complaints');
    return res.data;
  },

  updateStatus: async (id, status, comment) => {
    const res = await api.put(`/complaints/${id}/update-status`, { status, comment });
    return res.data;
  }
};

export default complaintApi;

