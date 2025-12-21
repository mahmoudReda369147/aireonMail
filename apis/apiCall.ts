import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API response interface
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

// Create axios instance with default configuration
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const authData = localStorage.getItem('aireon_auth');


      if (authData) {
        try {
          const { token } = JSON.parse(authData);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to parse auth token:', error);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized - clear auth and redirect to login
        localStorage.removeItem('aireon_auth');
        window.location.hash = '/login';
      }
      
      // Return consistent error format
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      return Promise.reject(new Error(errorMessage));
    }
  );

  return instance;
};

// API instance
const api = createApiInstance();

// Generic API call function
export const apiCall = async <T = any>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await api(config);
    return {
      data: response.data,
      status: response.status,
      success: true,
    };
  } catch (error) {
    throw error;
  }
};

// HTTP method helpers
export const get = <T = any>(url: string, config?: AxiosRequestConfig) =>
  apiCall<T>({ ...config, method: 'GET', url });

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  apiCall<T>({ ...config, method: 'POST', url, data });

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  apiCall<T>({ ...config, method: 'PUT', url, data });

export const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  apiCall<T>({ ...config, method: 'PATCH', url, data });

export const del = <T = any>(url: string, config?: AxiosRequestConfig) =>
  apiCall<T>({ ...config, method: 'DELETE', url });

export default api;
