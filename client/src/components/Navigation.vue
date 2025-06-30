<template>
  <nav class="navigation">
    <div class="nav-container">
      <div class="nav-brand">
        <router-link to="/" class="brand-link">
          Gallery Management
        </router-link>
      </div>
      
      <ul class="nav-menu" :class="{ 'nav-menu--active': menuOpen }">
        <li class="nav-item">
          <router-link to="/" class="nav-link" @click="closeMenu">
            ホーム
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/artworks" class="nav-link" @click="closeMenu">
            絵画管理
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/locations" class="nav-link" @click="closeMenu">
            場所管理
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/exhibitions" class="nav-link" @click="closeMenu">
            展示管理
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/database" class="nav-link" @click="closeMenu">
            データベース
          </router-link>
        </li>
      </ul>
      
      <button class="nav-toggle" @click="toggleMenu" :class="{ 'nav-toggle--active': menuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuOpen = ref(false)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}
</script>

<style scoped>
.navigation {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.nav-brand {
  font-size: 20px;
  font-weight: 700;
}

.brand-link {
  color: #007bff;
  text-decoration: none;
  transition: color 0.2s ease;
}

.brand-link:hover {
  color: #0056b3;
}

.nav-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: block;
  padding: 8px 16px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: #f8f9fa;
  color: #007bff;
}

.nav-link.router-link-active {
  background-color: #007bff;
  color: white;
}

.nav-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  width: 24px;
  height: 24px;
  justify-content: space-between;
}

.nav-toggle span {
  display: block;
  height: 2px;
  width: 100%;
  background-color: #333;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.nav-toggle--active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.nav-toggle--active span:nth-child(2) {
  opacity: 0;
}

.nav-toggle--active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 10px;
  }
  
  .nav-menu {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background-color: white;
    flex-direction: column;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    gap: 4px;
  }
  
  .nav-menu--active {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  
  .nav-link {
    padding: 12px 16px;
    border-radius: 8px;
  }
  
  .nav-toggle {
    display: flex;
  }
}
</style>