import api from './axiosConfig';

const adminDormApi = {
  // Buildings
  getBuildings: async () => {
    const res = await api.get('/admin-dorm/buildings');
    return res.data;
  },
  createBuilding: async (data) => {
    const res = await api.post('/admin-dorm/buildings', data);
    return res.data;
  },
  updateBuilding: async (id, data) => {
    const res = await api.put(`/admin-dorm/buildings/${id}`, data);
    return res.data;
  },
  deleteBuilding: async (id) => {
    const res = await api.delete(`/admin-dorm/buildings/${id}`);
    return res.data;
  },

  // Floors
  getFloors: async (buildingId) => {
    const res = await api.get(`/admin-dorm/buildings/${buildingId}/floors`);
    return res.data;
  },
  addFloor: async (data) => {
    const res = await api.post('/admin-dorm/floors', data);
    return res.data;
  },
  deleteFloor: async (id) => {
    const res = await api.delete(`/admin-dorm/floors/${id}`);
    return res.data;
  },

  // Rooms
  getRooms: async (floorId) => {
    const res = await api.get(`/admin-dorm/floors/${floorId}/rooms`);
    return res.data;
  },
  addRoom: async (data) => {
    const res = await api.post('/admin-dorm/rooms', data);
    return res.data;
  },
  updateRoom: async (id, data) => {
    const res = await api.put(`/admin-dorm/rooms/${id}`, data);
    return res.data;
  },
  deleteRoom: async (id) => {
    const res = await api.delete(`/admin-dorm/rooms/${id}`);
    return res.data;
  }
};

export default adminDormApi;
