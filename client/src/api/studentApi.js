import api from './axiosConfig';

const studentApi = {
  // Get student dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/students/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching dashboard data' };
    }
  },

  // Get student profile
  getProfile: async () => {
    try {
      const response = await api.get('/students/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching profile' };
    }
  },

  // Update student profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/students/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error updating profile' };
    }
  },

  // Get student applications
  getApplications: async () => {
    try {
      const response = await api.get('/students/applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching applications' };
    }
  },

  // Submit new application
  submitApplication: async (applicationData) => {
    try {
      const response = await api.post('/students/applications', applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error submitting application' };
    }
  },

  // Get room details and dormmates
  getRoomDetails: async () => {
    try {
      const response = await api.get('/students/room-details');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching room details' };
    }
  },
  
  // Schedule a future notification
  scheduleNotification: async (notificationData) => {
    try {
      const response = await api.post('/notifications/schedule', notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error scheduling notification' };
    }
  }
};

export default studentApi;