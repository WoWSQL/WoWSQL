import axios from 'axios'
import { API_URL } from './constants'

// Extend AxiosRequestConfig to include our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    _isAuthCheck?: boolean
    _isOAuthVerification?: boolean
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Always send cookies with requests
})

// Cookies are automatically sent with requests, no need to manually add tokens
// The backend will read tokens from cookies first, then fallback to Authorization header

// Handle token refresh on 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
  config: any
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(api.request(prom.config))
    }
  })
  
  failedQueue = []
}

// Pages where we shouldn't try to refresh tokens (public auth pages)
const authPages = ['/login', '/login/verify-otp', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/auth/callback', '/auth/set-password']

// Request interceptor to mark auth check requests
api.interceptors.request.use(
  (config) => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    
    // Mark requests to /api/v1/auth/me as auth checks (401 is expected if not logged in)
    if (config.url?.includes('/api/v1/auth/me')) {
      config._isAuthCheck = true
      
      // If we're on OAuth callback page, mark as OAuth verification
      if (currentPath.includes('/auth/callback')) {
        config._isOAuthVerification = true
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const currentPath = window.location.pathname

    // Don't try to refresh on auth pages or if 2FA is in progress
    const isAuthPage = authPages.some(page => currentPath.startsWith(page))
    const is2FAInProgress = sessionStorage.getItem('2fa_email') !== null

    // Check if OAuth is in progress - don't redirect to login during OAuth
    const isOAuthInProgress = typeof window !== 'undefined' && 
      (sessionStorage.getItem('oauth_authenticating') === 'true' || 
       sessionStorage.getItem('oauth_completed') === 'true')

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh on auth pages or during 2FA or OAuth
      if (isAuthPage || is2FAInProgress || isOAuthInProgress) {
        // For OAuth verification requests, 401 is expected until cookies are set
        if (originalRequest._isOAuthVerification || isOAuthInProgress) {
          // This is expected during OAuth callback - cookies might not be set yet
          // Don't redirect to login during OAuth
          return Promise.reject(error)
        }
        
        // For auth check requests on auth pages, 401 is expected - silently reject
        if (originalRequest._isAuthCheck && isAuthPage) {
          // This is expected - user is not logged in, which is fine on auth pages
          return Promise.reject(error)
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Refresh endpoint will read refresh token from cookie automatically
        await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, {
          withCredentials: true  // Ensure cookies are sent
        })
        
        isRefreshing = false
        processQueue(null)
        
        // Retry original request (cookies will be sent automatically)
        return api.request(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        processQueue(refreshError, null)
        
        // Refresh failed, redirect to login (only if not already on login page and not during OAuth)
        const isOAuthInProgress = typeof window !== 'undefined' && 
          (sessionStorage.getItem('oauth_authenticating') === 'true' || 
           sessionStorage.getItem('oauth_completed') === 'true')
        
        if (!isAuthPage && !isOAuthInProgress) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export class WowBaseClient {
  private apiUrl: string
  private apiKey?: string
  private token?: string

  constructor(config: { url: string; apiKey?: string }) {
    this.apiUrl = config.url
    this.apiKey = config.apiKey
  }

  setToken(token: string) {
    this.token = token
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    } else if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`
    }
    
    return headers
  }

  from(table: string) {
    return new QueryBuilder(this.apiUrl, table, this.getHeaders())
  }

  get auth() {
    return {
      signUp: async (data: { email: string; password: string; full_name?: string }) => {
        const response = await axios.post(`${this.apiUrl}/api/v1/auth/register`, data)
        return response.data
      },
      
      signIn: async (data: { email: string; password: string }) => {
        const response = await axios.post(`${this.apiUrl}/api/v1/auth/login`, data)
        if (response.data.access_token) {
          this.token = response.data.access_token
        }
        return response.data
      },
      
      signOut: async () => {
        this.token = undefined
        // Call logout endpoint to clear cookies
        try {
          await axios.post(`${this.apiUrl}/api/v1/auth/logout`, {}, {
            withCredentials: true
          })
        } catch (err) {
          // Ignore errors, cookies will be cleared anyway
        }
      },
      
      getUser: async () => {
        const response = await axios.get(`${this.apiUrl}/api/v1/auth/me`, {
          headers: this.getHeaders()
        })
        return response.data
      }
    }
  }

  get storage() {
    return {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          const formData = new FormData()
          formData.append('file', file)
          
          const response = await axios.post(
            `${this.apiUrl}/api/v1/storage/buckets/${bucket}/upload?path=${path}`,
            formData,
            {
              headers: {
                ...this.getHeaders(),
                'Content-Type': 'multipart/form-data',
              }
            }
          )
          return response.data
        },
        
        list: async (prefix: string = '') => {
          const response = await axios.get(
            `${this.apiUrl}/api/v1/storage/buckets/${bucket}/files?prefix=${prefix}`,
            { headers: this.getHeaders() }
          )
          return response.data
        },
        
        remove: async (path: string) => {
          const response = await axios.delete(
            `${this.apiUrl}/api/v1/storage/buckets/${bucket}/files/${path}`,
            { headers: this.getHeaders() }
          )
          return response.data
        }
      })
    }
  }
}

class QueryBuilder {
  private apiUrl: string
  private table: string
  private headers: Record<string, string>
  private selectCols?: string[]
  private filters: any[] = []
  private orderByCol?: string
  private orderDir: 'asc' | 'desc' = 'asc'
  private limitNum?: number
  private offsetNum?: number

  constructor(apiUrl: string, table: string, headers: Record<string, string>) {
    this.apiUrl = apiUrl
    this.table = table
    this.headers = headers
  }

  select(columns: string = '*') {
    this.selectCols = columns === '*' ? undefined : columns.split(',').map(c => c.trim())
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value })
    return this
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value })
    return this
  }

  gt(column: string, value: any) {
    this.filters.push({ column, operator: 'gt', value })
    return this
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value })
    return this
  }

  like(column: string, pattern: string) {
    this.filters.push({ column, operator: 'like', value: pattern })
    return this
  }

  order(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.orderByCol = column
    this.orderDir = direction
    return this
  }

  limit(num: number) {
    this.limitNum = num
    return this
  }

  offset(num: number) {
    this.offsetNum = num
    return this
  }

  async execute() {
    const payload = {
      select: this.selectCols,
      filters: this.filters.length > 0 ? this.filters : undefined,
      order_by: this.orderByCol,
      order_direction: this.orderDir,
      limit: this.limitNum,
      offset: this.offsetNum,
    }

    const response = await axios.post(
      `${this.apiUrl}/api/v1/db/tables/${this.table}/query`,
      payload,
      { headers: this.headers }
    )
    
    return { data: response.data.data, error: null }
  }

  // Make it awaitable
  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject)
  }
}

export default api

