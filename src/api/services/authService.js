import axiosClient from '../axiosClient';

const login = async (email, password) => {
  const resp = await axiosClient.post('/auth/login', { email, password });
  return resp.data;
};

const validate = async () => {
  const resp = await axiosClient.post('/auth/validate');
  return resp.data;
};

export default {
  login,
  validate,
};
