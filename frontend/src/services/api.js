import axios from 'axios';

const baseURL ='/api';
export const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });

let onAuthExpired = () => {};
let refreshInFlight;
export const setAuthExpiredHandler = (handler) => { onAuthExpired = handler; };

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  if (error.response?.status !== 401 || !original || original._retried || original.url?.includes('/auth/token')) {
    return Promise.reject(error);
  }
  const refresh = sessionStorage.getItem('refreshToken');
  if (!refresh) {
    onAuthExpired();
    return Promise.reject(error);
  }
  original._retried = true;
  try {
    refreshInFlight ||= axios.post(`${baseURL}/auth/token/refresh/`, { refresh });
    const { data } = await refreshInFlight;
    sessionStorage.setItem('accessToken', data.access);
    refreshInFlight = undefined;
    return api(original);
  } catch (refreshError) {
    refreshInFlight = undefined;
    onAuthExpired();
    return Promise.reject(refreshError);
  }
});

const authAPI = {
  login: (credentials) => api.post('/auth/token/', credentials),
  refresh: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  register: (payload) => api.post('/auth/register/', payload),
};

const adminAPI = {
  teachers: () => api.get('/admin/teachers/'),
  students: () => api.get('/admin/students/'),
  pendingTeachers: () => api.get('/admin/teachers/pending/'),
  approvedTeachers: () => api.get('/admin/teachers/approved/'),
  rejectedTeachers: () => api.get('/admin/teachers/rejected/'),
  approveTeacher: (id) => api.post(`/admin/teachers/${id}/approve/`),
  rejectTeacher: (id) => api.post(`/admin/teachers/${id}/reject/`),
};

const teacherAPI = {
  sessions: () => api.get('/sessions/'),
  createSession: (payload) => api.post('/sessions/', payload),
  profile: () => api.get('/teacher-profiles/'),
  departments: () => api.get('/departments/'),
  attendance: () => api.get('/attendance/'),
};

const studentAPI = {
  profile: () => api.get('/student-profiles/'),
  attendance: () => api.get('/attendance/'),
  scan: (qr_token) => api.post('/attendance/scan/', { qr_token }),
};

export { authAPI, adminAPI, teacherAPI, studentAPI };

export function listData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function apiError(error) {
  const status = error.response?.status;
  const data = error.response?.data;
  if (data?.error) return data.error;
  if (status === 400 && data && typeof data === 'object') {
    return Object.entries(data).map(([field, messages]) => `${field === 'non_field_errors' ? '' : `${field.replaceAll('_', ' ')}: `}${Array.isArray(messages) ? messages.join(' ') : messages}`).join(' ');
  }
  if (status === 401) {
    if (/\/auth\/token\/?$/.test(error.config?.url || '')) {
      return 'Username or password is incorrect.';
    }
    return 'Your session has expired. Please log in again.';
  }
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'Requested resource was not found.';
  if (status >= 500) return 'Something went wrong. Please try again.';
  return error.message || 'Could not connect to the server. Check that Django is running.';
}
