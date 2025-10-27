import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Public API (userpost) - no auth header by default
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/userpost/api',
  timeout: 10000,
});

// Attach token on each userpost api request as well (if any)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = localStorage.getItem('access_token')
  if (access) {
    config.headers = config.headers ?? {}
    ;(config.headers as any)['Authorization'] = `Bearer ${access}`
  }
  return config
})

// Backend base for auth and accounts
const BACKEND_BASE: string = (import.meta as any).env?.VITE_BACKEND_BASE_URL ?? 'http://localhost:8000'
export const backendApi = axios.create({
  baseURL: BACKEND_BASE,
  timeout: 10000,
});

// Token helpers
export function setAuthToken(token: string | null) {
  if (token) {
    backendApi.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('access_token', token)
  } else {
    delete backendApi.defaults.headers.common['Authorization']
    localStorage.removeItem('access_token')
  }
}

export function restoreAuthFromStorage() {
  const access = localStorage.getItem('access_token')
  if (access) backendApi.defaults.headers.common['Authorization'] = `Bearer ${access}`
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem('refresh_token', token)
  else localStorage.removeItem('refresh_token')
}

export async function logoutJwt() {
  setAuthToken(null)
  setRefreshToken(null)
}

// Attach token on each backendApi request (if any)
backendApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = localStorage.getItem('access_token')
  if (access) {
    config.headers = config.headers ?? {}
    ;(config.headers as any)['Authorization'] = `Bearer ${access}`
  }
  return config
})

// Refresh on 401 for backendApi
let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

backendApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status
    const original = error.config as any
    if (status === 401 && !original?._retry) {
      const refresh = getRefreshToken()
      if (!refresh) return Promise.reject(error)
      if (isRefreshing) {
        // queue until refresh done
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              original.headers = original.headers ?? {}
              original.headers['Authorization'] = `Bearer ${token}`
              resolve(backendApi.request(original))
            } else {
              reject(error)
            }
          })
        })
      }
      try {
        isRefreshing = true
        original._retry = true
        const resp = await axios.post<{ access: string }>(`${BACKEND_BASE}/auth/jwt/refresh/`, { refresh })
        const newAccess = resp.data.access
        setAuthToken(newAccess)
        // flush queue
        pendingQueue.forEach(fn => fn(newAccess))
        pendingQueue = []
        original.headers = original.headers ?? {}
        original.headers['Authorization'] = `Bearer ${newAccess}`
        return backendApi.request(original)
      } catch (e) {
        setAuthToken(null)
        setRefreshToken(null)
        pendingQueue.forEach(fn => fn(null))
        pendingQueue = []
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// Refresh on 401 for userpost api
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status
    const original = error.config as any
    if (status === 401 && !original?._retry) {
      const refresh = getRefreshToken()
      if (!refresh) return Promise.reject(error)
      if (isRefreshing) {
        // queue until refresh done
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              original.headers = original.headers ?? {}
              original.headers['Authorization'] = `Bearer ${token}`
              resolve(api.request(original))
            } else {
              reject(error)
            }
          })
        })
      }
      try {
        isRefreshing = true
        original._retry = true
        const resp = await axios.post<{ access: string }>(`${BACKEND_BASE}/auth/jwt/refresh/`, { refresh })
        const newAccess = resp.data.access
        setAuthToken(newAccess)
        // flush queue
        pendingQueue.forEach(fn => fn(newAccess))
        pendingQueue = []
        original.headers = original.headers ?? {}
        original.headers['Authorization'] = `Bearer ${newAccess}`
        return api.request(original)
      } catch (e) {
        setAuthToken(null)
        setRefreshToken(null)
        pendingQueue.forEach(fn => fn(null))
        pendingQueue = []
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export type UserSummary = { id: number; username: string };
export type UserPost = {
  id: number;
  user: UserSummary;
  description: string;
  content_url: string;
  created_at: string;
  good_count: number;
  list_id?: number;
};

export type ContentData = {
  id: number;
  content_url: string;
  title: string;
  description: string;
  image: string;
  created_at: string;
  content_type: string;
  good_count: number;
};

export type Me = {
  id: number;
  username: string;
  email?: string;
  private?: boolean;
}

export type PublicUser = {
  username: string;
  posts: Array<{ id: number; content_url: string; description: string | null; created_at: string; title?: string; image?: string; content_type?: string }>
}

// Public endpoints
export const fetchPosts = (params?: Record<string, string | number>) => api.get<UserPost[]>('/posts/', { params });
export const createPost = (payload: { description: string; content_url: string; content_type: string; list_id?: number | null }) =>
  api.post('/posts/', payload);
export const deletePost = (id: number) => api.delete(`/posts/${id}/`)
export const movePostList = (id: number, list_id: number) => api.post(`/posts/${id}/move_list/`, { list_id })

export const fetchContents = (params?: { limit?: number; offset?: number }) => api.get<ContentData[]>('/contents/', { params });
export const createContent = (payload: { content_url: string; content_type?: string }) => api.post('/contents/', payload);
export const goodContent = (id: number) => api.post(`/contents/${id}/good/`);

// Auth (JWT)
export const loginJwt = async (payload: { username: string; password: string }) => {
  const res = await axios.post<{ access: string; refresh: string }>(`${BACKEND_BASE}/auth/jwt/create/`, payload)
  const { access, refresh } = res.data
  setAuthToken(access)
  setRefreshToken(refresh)
  return res
}

// Accounts (requires auth)
export const fetchMe = () => backendApi.get<Me>(`/accounts/me/`)

// Accounts - register (public)
export const registerAccount = async (payload: { username: string; email?: string; password: string }) => {
  return axios.post(`${BACKEND_BASE}/accounts/register/`, payload)
}

// Accounts - rename username (auth required)
export const renameUsername = (payload: { username: string }) =>
  backendApi.post<Me>(`/accounts/rename/`, payload)

// Accounts - privacy
export const getPrivacy = () => backendApi.get<{ private: boolean }>(`/accounts/privacy/`)
export const setPrivacy = (value: boolean) => backendApi.post<{ private: boolean }>(`/accounts/privacy/`, { private: value })

// Public users list
export const fetchPublicUsers = () => api.get<PublicUser[]>(`/public_users/`)

// User Lists (requires auth; operates on current user)
export type UserList = {
  id: number;
  owner_id: number;
  owner_username?: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  goot_count: number;
  created_at: string;
  updated_at: string;
  is_goot?: boolean;
}

export const fetchMyLists = () => backendApi.get<UserList[]>(`/userlists/api/lists/`)
export const createList = (payload: { name: string; description?: string; is_public?: boolean }) =>
  backendApi.post<UserList>(`/userlists/api/lists/`, payload)
export const gootList = (id: number) => backendApi.post<{ is_goot: boolean; goot_count: number }>(`/userlists/api/lists/${id}/goot/`)
export const fetchFavoriteLists = () => backendApi.get<UserList[]>(`/userlists/api/lists/favorites/`)
export const fetchListsByUser = (username: string) => backendApi.get<UserList[]>(`/userlists/api/lists/by_user/`, { params: { username } })
export const fetchListPublic = (id: number) => backendApi.get<UserList>(`/userlists/api/lists/${id}/retrieve_public/`)
export const renameList = (id: number, name: string) => backendApi.post<UserList>(`/userlists/api/lists/${id}/rename/`, { name })
export const toggleListPublic = (id: number, is_public: boolean) => backendApi.post<{ id: number; is_public: boolean }>(`/userlists/api/lists/${id}/toggle_public/`, { is_public })
export const deleteList = (id: number) => backendApi.delete(`/userlists/api/lists/${id}/`)
export const updateList = (id: number, payload: { name?: string; description?: string; is_public?: boolean }) =>
  backendApi.patch<UserList>(`/userlists/api/lists/${id}/`, payload)
