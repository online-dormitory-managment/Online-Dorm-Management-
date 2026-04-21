import api from './axiosConfig';

const API_URL = '/role-applications';

const roleApplicationApi = {
  submit: async (formData) => {
    // Check if formData is an instance of FormData (for file uploads)
    const isFormData = formData instanceof FormData;
    const response = await api.post(API_URL, formData, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
      }
    });
    return response.data;
  },

  list: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },

  review: async (id, status, reviewNote) => {
    const response = await api.put(`${API_URL}/${id}/review`, { status, reviewNote });
    return response.data;
  }
};

export default roleApplicationApi;
