import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'
import App from './App.vue'

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 seconds timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Set base URL for production
if (import.meta.env.PROD) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://gallery-management-api.onrender.com';
}

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url, config);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Import views
import Home from './views/Home.vue'
import Artworks from './views/Artworks.vue'
import Locations from './views/Locations.vue'
import Exhibitions from './views/Exhibitions.vue'
import Database from './views/Database.vue'

// Router configuration
const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/artworks', name: 'Artworks', component: Artworks },
  { path: '/locations', name: 'Locations', component: Locations },
  { path: '/exhibitions', name: 'Exhibitions', component: Exhibitions },
  { path: '/database', name: 'Database', component: Database },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Create and mount the app
const app = createApp(App)
app.use(router)
app.mount('#app')