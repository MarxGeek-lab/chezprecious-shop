import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api-backend/api';

// Base origin de l'API (sans le /api) pour résoudre les URLs d'uploads
const API_ORIGIN = API_URL.replace(/\/api$/, '');

/**
 * Résout une URL d'image/vidéo relative (ex: /uploads/products/images/xxx.jpg)
 * en URL absolue pointant vers le serveur API.
 * Retourne undefined si l'URL est nulle/vide.
 */
export function getAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur : ajouter le token admin JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur : gérer les erreurs 401 (redirection login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        // Redirect vers login si pas déjà sur la page login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
