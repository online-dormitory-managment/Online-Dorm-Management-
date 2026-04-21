import api from './axiosConfig';

export const paymentApi = {
  /**
   * Initialize a Chapa payment
   * @param {Object} data { amount, currency }
   * @returns {Promise} { checkout_url, tx_ref }
   */
  initialize: async (data) => {
    try {
      const response = await api.post('/payment/initialize', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify a Chapa payment
   * @param {string} tx_ref 
   * @returns {Promise} verification data
   */
  verify: async (tx_ref) => {
    try {
      const response = await api.get(`/payment/verify/${tx_ref}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  /**
   * Manually check status of student's latest pending transaction
   */
  checkStatus: async () => {
    try {
      const response = await api.post('/payment/check-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default paymentApi;
