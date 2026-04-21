import api from './axiosConfig';

const noticeApi = {
    list: async () => {
        const res = await api.get('/notices');
        return res.data;
    },
    create: async (data) => {
        const res = await api.post('/notices', data);
        return res.data;
    }
};

export default noticeApi;
