import api from './axiosConfig';

const maintenanceApi = {
  submit: async (payload) => {
    const form = new FormData();
    form.append('issueCategory', payload.issueCategory);
    form.append('location', payload.location);
    form.append('urgency', payload.urgency);
    form.append('description', payload.description);
    if (payload.attachment) form.append('attachment', payload.attachment);

    const res = await api.post('/maintenance/submit', form);
    return res.data;
  },

  my: async () => {
    const res = await api.get('/maintenance/my');
    return res.data;
  },

  allForProctor: async () => {
    const res = await api.get('/maintenance/all');
    return res.data;
  },

  updateStatus: async (id, status, comment) => {
    const res = await api.put(`/maintenance/${id}/update-status`, { status, comment });
    return res.data;
  }
};

export default maintenanceApi;

