import axios from 'axios';
import axiosClient, { apiConfig } from '../axiosClient';

const publicClient = axios.create(apiConfig);

const login = async (email, password) => {
  const resp = await axiosClient.post('/auth/login', { email, password });
  return resp.data;
};

const validate = async () => {
  const resp = await axiosClient.post('/auth/validate');
  return resp.data;
};

const forgotPassword = async (email) => {
  const resp = await publicClient.post('/auth/forgot-password', { email });
  return resp.data;
};

const resetPassword = async (token, password) => {
  const resp = await publicClient.post('/auth/reset-password', { token, password });
  return resp.data;
};

export default {
  forgotPassword,
  login,
  resetPassword,
  validate,
};
