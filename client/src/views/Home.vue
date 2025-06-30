<template>
  <div class="home">
    <div class="welcome-section">
      <h1 class="page-title">Gallery Management System</h1>
      <p class="page-description">
        ギャラリーの作品と展示スペースを効率的に管理できるシステムです。
      </p>
    </div>

    <div class="stats-grid" v-if="!loading">
      <div class="stat-card">
        <div class="stat-number">{{ stats.tables.artworks }}</div>
        <div class="stat-label">登録作品数</div>
        <router-link to="/artworks" class="stat-link">管理画面へ →</router-link>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">{{ stats.tables.locations }}</div>
        <div class="stat-label">展示場所数</div>
        <router-link to="/locations" class="stat-link">管理画面へ →</router-link>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">{{ stats.exhibitions.active }}</div>
        <div class="stat-label">現在展示中</div>
        <router-link to="/exhibitions" class="stat-link">管理画面へ →</router-link>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">{{ stats.exhibitions.scheduled }}</div>
        <div class="stat-label">展示予定</div>
        <router-link to="/exhibitions" class="stat-link">管理画面へ →</router-link>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>データを読み込み中...</p>
    </div>

    <div class="current-exhibitions" v-if="!loading && currentExhibitions.length > 0">
      <h2 class="section-title">現在の展示</h2>
      <div class="exhibitions-grid">
        <div 
          v-for="exhibition in currentExhibitions" 
          :key="exhibition.id"
          class="exhibition-card"
        >
          <div class="exhibition-header">
            <h3 class="exhibition-title">{{ exhibition.artwork?.title }}</h3>
            <div class="exhibition-location">場所 {{ exhibition.location_id }}</div>
          </div>
          <div class="exhibition-details">
            <p class="exhibition-artist">作者: {{ exhibition.artwork?.artist }}</p>
            <p class="exhibition-period">
              {{ formatDate(exhibition.start_date) }} 〜 {{ formatDate(exhibition.end_date) }}
            </p>
            <p class="exhibition-location-details">
              {{ exhibition.location?.description }}
              ({{ exhibition.location?.width }}×{{ exhibition.location?.height }}cm)
            </p>
            <div v-if="exhibition.notes" class="exhibition-notes">
              {{ exhibition.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2 class="section-title">クイックアクション</h2>
      <div class="actions-grid">
        <router-link to="/artworks" class="action-card">
          <div class="action-icon">🎨</div>
          <div class="action-title">新しい作品を登録</div>
          <div class="action-description">ギャラリーに新しい作品情報を追加</div>
        </router-link>
        
        <router-link to="/exhibitions" class="action-card">
          <div class="action-icon">📅</div>
          <div class="action-title">展示を予約</div>
          <div class="action-description">作品の展示スケジュールを設定</div>
        </router-link>
        
        <router-link to="/locations" class="action-card">
          <div class="action-icon">📍</div>
          <div class="action-title">場所を管理</div>
          <div class="action-description">展示場所のサイズや詳細を編集</div>
        </router-link>
        
        <router-link to="/database" class="action-card">
          <div class="action-icon">💾</div>
          <div class="action-title">データを確認</div>
          <div class="action-description">データベースの内容を直接確認</div>
        </router-link>
      </div>
    </div>

    <div class="alert alert-error" v-if="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { DatabaseStats, Exhibition } from '@/types'

const loading = ref(true)
const error = ref('')
const stats = ref<DatabaseStats>({
  tables: { artworks: 0, locations: 0, exhibitions: 0 },
  exhibitions: { total: 0, active: 0, scheduled: 0 },
  database: { size_bytes: 0, size_mb: 0 }
})
const currentExhibitions = ref<Exhibition[]>([])

const fetchStats = async () => {
  try {
    const response = await axios.get('/api/database/stats/summary')
    stats.value = response.data
    console.log('Stats fetched successfully:', response.data)
  } catch (err: any) {
    console.error('Failed to fetch stats:', err)
    console.error('Error details:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    })
    error.value = `統計データの取得に失敗しました: ${err.response?.status || 'Network Error'}`
  }
}

const fetchCurrentExhibitions = async () => {
  try {
    const response = await axios.get('/api/exhibitions/current')
    currentExhibitions.value = response.data
    console.log('Current exhibitions fetched successfully:', response.data)
  } catch (err: any) {
    console.error('Failed to fetch current exhibitions:', err)
    console.error('Current exhibitions error details:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    })
    // Don't overwrite the main error if stats already failed
    if (!error.value) {
      error.value = `現在の展示データの取得に失敗しました: ${err.response?.status || 'Network Error'}`
    }
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    await Promise.all([fetchStats(), fetchCurrentExhibitions()])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home {
  max-width: 1000px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.page-title {
  font-size: 2.5em;
  margin-bottom: 16px;
  font-weight: 700;
}

.page-description {
  font-size: 1.2em;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.stat-number {
  font-size: 2.5em;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 1.1em;
  color: #666;
  margin-bottom: 12px;
}

.stat-link {
  color: #007bff;
  text-decoration: none;
  font-size: 0.9em;
  font-weight: 500;
}

.stat-link:hover {
  text-decoration: underline;
}

.section-title {
  font-size: 1.8em;
  margin-bottom: 24px;
  color: #333;
  font-weight: 600;
}

.current-exhibitions {
  margin-bottom: 40px;
}

.exhibitions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.exhibition-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #28a745;
}

.exhibition-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.exhibition-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.exhibition-location {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
}

.exhibition-details p {
  margin: 8px 0;
  color: #666;
}

.exhibition-artist {
  font-weight: 500;
  color: #333;
}

.exhibition-period {
  font-size: 0.9em;
}

.exhibition-location-details {
  font-size: 0.9em;
}

.exhibition-notes {
  margin-top: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9em;
  color: #555;
}

.quick-actions {
  margin-bottom: 40px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: block;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  text-decoration: none;
}

.action-icon {
  font-size: 2em;
  margin-bottom: 12px;
}

.action-title {
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.action-description {
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading .spinner {
  margin: 0 auto 16px;
}

@media (max-width: 768px) {
  .welcome-section {
    padding: 30px 15px;
  }
  
  .page-title {
    font-size: 2em;
  }
  
  .stats-grid,
  .actions-grid,
  .exhibitions-grid {
    grid-template-columns: 1fr;
  }
  
  .exhibition-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .exhibition-location {
    align-self: flex-start;
  }
}
</style>