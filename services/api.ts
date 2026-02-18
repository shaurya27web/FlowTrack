import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.31.227:5000/api'; // ← your IP here

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ 401 is EXPECTED when logged out — don't log it as an error
    if (error.response?.status === 401) {
      return Promise.reject(error); // silently reject
    }
    if (error.code === 'ECONNABORTED') {
      console.warn('⚠️  Request timeout - server not responding');
    } else if (error.message === 'Network Error') {
      console.warn('⚠️  Network Error - cannot reach server');
    } else if (error.response) {
      console.warn('⚠️  Server Error:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data);

export const register = (data: { name: string; email: string; password: string }) =>
  api.post('/auth/register', data);

export const getTransactions = (month?: number | string, year?: number | string) =>
  api.get('/transactions', { params: month && year ? { month, year } : undefined });

export const addTransaction = (data: {
  title: string; amount: number;
  type: 'income' | 'expense'; category: string; notes?: string;
}) => api.post('/transactions', data);

export const updateTransaction = (id: string, data: any) =>
  api.put(`/transactions/${id}`, data);

export const deleteTransaction = (id: string) =>
  api.delete(`/transactions/${id}`);

export const getCategories = () => api.get('/categories');

export const addCategory = (data: {
  name: string; type: string; color?: string; icon?: string;
}) => api.post('/categories', data);

export const getDashboardStats = () => api.get('/stats/dashboard');

export default api;