import axios from 'axios'

// In development, use relative URL to leverage Vite proxy (avoids CORS)
// In production, use the full API URL
const baseURL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api')


const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Logging disabled for cleaner console
    // if (import.meta.env.DEV) {
    //   console.log('[axiosConfig] Request:', {
    //     method: config.method,
    //     url: config.url,
    //     baseURL: config.baseURL,
    //     fullURL: `${config.baseURL}${config.url}`
    //   })
    // }
    return config
  },
  (error) => {
    console.error('[axiosConfig] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Logging disabled for cleaner console
    // if (import.meta.env.DEV) {
    //   console.log('[axiosConfig] Response:', {
    //     status: response.status,
    //     url: response.config.url
    //   })
    // }
    return response
  },
  async (error) => {
    // Suppress logging for expected validation errors (already bookmarked/favorited)
    const shouldSuppressLog =
      error.response?.status === 400 &&
      (error.config?.url?.includes('/bookmarks') || error.config?.url?.includes('/favorites'));

    // If this is a bookmark/favorite error, fetch the message to check if it's "already exists"
    if (shouldSuppressLog && error.response?.data?.message?.includes('sudah ada')) {
      // Completely suppress this error - don't log anything
      const suppressedError = new Error('Bookmark already exists (suppressed)');
      suppressedError.response = error.response;
      suppressedError.config = error.config;
      suppressedError.__suppressed = true;
      return Promise.reject(suppressedError);
    }

    // Only log actual errors (not 401 auth errors or suppressed validation errors)
    if (!shouldSuppressLog && error.response?.status !== 401) {
      console.error('[axiosConfig] Response error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message
      })
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

