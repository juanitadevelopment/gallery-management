<template>
  <div class="database">
    <div class="page-header">
      <h1 class="page-title">データベース閲覧</h1>
      <p class="page-description">データベースの生データを確認できます（開発・デバッグ用）</p>
    </div>

    <div class="alert alert-error" v-if="error">
      {{ error }}
    </div>

    <!-- Database Health Check -->
    <div class="card health-card" style="margin-bottom: 20px;">
      <div class="card-header">
        <h3 class="card-title">データベース状況</h3>
        <button class="btn btn-sm btn-secondary" @click="fetchHealth" :disabled="loading">
          更新
        </button>
      </div>
      <div class="card-body">
        <div v-if="healthLoading" class="loading-inline">
          <div class="spinner-sm"></div>
          <span>確認中...</span>
        </div>
        <div v-else-if="health" class="health-info">
          <div class="health-status">
            <span class="health-badge" :class="health.status === 'healthy' ? 'status-healthy' : 'status-unhealthy'">
              {{ health.status === 'healthy' ? '正常' : '異常' }}
            </span>
            <span class="health-time">{{ formatDateTime(health.timestamp) }}</span>
          </div>
          <div class="health-details">
            <div class="health-item">
              <strong>接続:</strong> {{ health.connectivity ? '正常' : '異常' }}
            </div>
            <div class="health-item">
              <strong>ジャーナルモード:</strong> {{ health.configuration?.journal_mode || 'unknown' }}
            </div>
            <div class="health-item">
              <strong>外部キー制約:</strong> {{ health.configuration?.foreign_keys ? '有効' : '無効' }}
            </div>
            <div class="health-item">
              <strong>整合性:</strong> {{ health.integrity === 'ok' ? '正常' : '問題あり' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Database Statistics -->
    <div class="card stats-card" style="margin-bottom: 20px;">
      <div class="card-header">
        <h3 class="card-title">データベース統計</h3>
        <button class="btn btn-sm btn-secondary" @click="fetchStats" :disabled="loading">
          更新
        </button>
      </div>
      <div class="card-body">
        <div v-if="statsLoading" class="loading-inline">
          <div class="spinner-sm"></div>
          <span>読み込み中...</span>
        </div>
        <div v-else-if="stats" class="stats-grid">
          <div class="stat-item">
            <div class="stat-category">テーブル</div>
            <div class="stat-details">
              <div>アートワーク: {{ stats.tables.artworks }}件</div>
              <div>場所: {{ stats.tables.locations }}件</div>
              <div>展示: {{ stats.tables.exhibitions }}件</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-category">展示状況</div>
            <div class="stat-details">
              <div>合計: {{ stats.exhibitions.total }}件</div>
              <div>展示中: {{ stats.exhibitions.active }}件</div>
              <div>予定: {{ stats.exhibitions.scheduled }}件</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-category">データベース</div>
            <div class="stat-details">
              <div>サイズ: {{ stats.database.size_mb }}MB</div>
              <div>バイト: {{ stats.database.size_bytes.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Selection -->
    <div class="card table-selector" style="margin-bottom: 20px;">
      <div class="card-body">
        <div class="table-controls">
          <div class="form-group">
            <label class="form-label">表示するテーブル</label>
            <select v-model="selectedTable" @change="fetchTableData" class="form-select">
              <option value="">テーブルを選択してください</option>
              <option value="artworks">artworks (アートワーク)</option>
              <option value="locations">locations (場所)</option>
              <option value="exhibitions">exhibitions (展示)</option>
            </select>
          </div>
          <button 
            class="btn btn-primary" 
            @click="fetchTableData" 
            :disabled="!selectedTable || loading"
          >
            データを取得
          </button>
        </div>
      </div>
    </div>

    <!-- Table Data Display -->
    <div v-if="tableData" class="card">
      <div class="card-header">
        <h3 class="card-title">
          {{ tableData.table_name }} テーブル
          <span class="table-info">({{ tableData.row_count }}件)</span>
        </h3>
        <button class="btn btn-sm btn-secondary" @click="fetchTableData" :disabled="loading">
          更新
        </button>
      </div>
      <div class="card-body">
        <!-- Schema Information -->
        <div class="schema-section">
          <h4 class="schema-title">テーブル構造</h4>
          <div class="schema-table">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>カラム名</th>
                  <th>データ型</th>
                  <th>NULL許可</th>
                  <th>主キー</th>
                  <th>デフォルト値</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="column in tableData.schema" :key="column.name">
                  <td class="column-name">{{ column.name }}</td>
                  <td class="column-type">{{ column.type }}</td>
                  <td class="column-null">{{ column.not_null ? 'いいえ' : 'はい' }}</td>
                  <td class="column-pk">{{ column.primary_key ? 'はい' : 'いいえ' }}</td>
                  <td class="column-default">{{ column.default_value || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Table Data -->
        <div class="data-section">
          <h4 class="data-title">データ</h4>
          <div v-if="tableData.data.length === 0" class="no-data">
            データがありません
          </div>
          <div v-else class="data-table-container">
            <table class="table data-table">
              <thead>
                <tr>
                  <th v-for="column in tableData.schema" :key="column.name">
                    {{ column.name }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in tableData.data" :key="index">
                  <td v-for="column in tableData.schema" :key="column.name">
                    <span v-if="row[column.name] === null" class="null-value">NULL</span>
                    <span v-else-if="typeof row[column.name] === 'string' && row[column.name].length > 50" 
                          class="long-text" 
                          :title="row[column.name]">
                      {{ row[column.name].substring(0, 50) }}...
                    </span>
                    <span v-else>{{ row[column.name] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>データを読み込み中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { DatabaseStats, DatabaseTable } from '@/types'

const loading = ref(false)
const healthLoading = ref(false)
const statsLoading = ref(false)
const error = ref('')
const selectedTable = ref('')
const tableData = ref<DatabaseTable | null>(null)
const stats = ref<DatabaseStats | null>(null)
const health = ref<any>(null)

const fetchHealth = async () => {
  try {
    healthLoading.value = true
    const response = await axios.get('/api/database/health')
    health.value = response.data
  } catch (err: any) {
    console.error('Failed to fetch database health:', err)
    health.value = {
      status: 'unhealthy',
      error: 'ヘルスチェックに失敗しました',
      timestamp: new Date().toISOString()
    }
  } finally {
    healthLoading.value = false
  }
}

const fetchStats = async () => {
  try {
    statsLoading.value = true
    console.log('Fetching database stats...')
    const response = await axios.get('/api/database/stats/summary')
    stats.value = response.data
    console.log('Database stats fetched successfully:', response.data)
  } catch (err: any) {
    console.error('Failed to fetch database stats:', err)
    console.error('Database stats error details:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data
    })
    error.value = `統計データの取得に失敗しました: ${err.response?.status || 'Network Error'}`
  } finally {
    statsLoading.value = false
  }
}

const fetchTableData = async () => {
  if (!selectedTable.value) return
  
  try {
    loading.value = true
    error.value = ''
    console.log(`Fetching table data for: ${selectedTable.value}`)
    const response = await axios.get(`/api/database/${selectedTable.value}`)
    tableData.value = response.data
    console.log('Table data fetched successfully:', response.data)
  } catch (err: any) {
    console.error('Failed to fetch table data:', err)
    console.error('Table data error details:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: `/api/database/${selectedTable.value}`
    })
    error.value = err.response?.data?.error || `テーブルデータの取得に失敗しました: ${err.response?.status || 'Network Error'}`
    tableData.value = null
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(async () => {
  await Promise.all([fetchHealth(), fetchStats()])
})
</script>

<style scoped>
.database {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 2em;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.page-description {
  color: #666;
  font-size: 1.1em;
  margin: 0;
}

.health-card .card-header,
.stats-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.spinner-sm {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

.health-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.health-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-healthy {
  background-color: #d4edda;
  color: #155724;
}

.status-unhealthy {
  background-color: #f8d7da;
  color: #721c24;
}

.health-time {
  font-size: 0.9em;
  color: #666;
}

.health-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.health-item {
  font-size: 0.9em;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-category {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.stat-details div {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 4px;
}

.table-controls {
  display: flex;
  gap: 16px;
  align-items: end;
}

.table-controls .form-group {
  flex: 1;
  margin-bottom: 0;
}

.table-info {
  font-size: 0.8em;
  color: #666;
  font-weight: normal;
}

.schema-section {
  margin-bottom: 32px;
}

.schema-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #007bff;
}

.data-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #28a745;
}

.schema-table {
  overflow-x: auto;
}

.table-sm th,
.table-sm td {
  padding: 8px 12px;
  font-size: 0.9em;
}

.column-name {
  font-weight: 600;
  color: #007bff;
}

.column-type {
  font-family: 'Courier New', monospace;
  color: #333;
}

.column-null,
.column-pk {
  text-align: center;
}

.column-default {
  font-family: 'Courier New', monospace;
  color: #666;
}

.data-table-container {
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.data-table {
  margin-bottom: 0;
}

.data-table th {
  position: sticky;
  top: 0;
  background-color: #f8f9fa;
  z-index: 10;
  font-weight: 600;
  font-size: 0.9em;
}

.data-table td {
  font-size: 0.85em;
  max-width: 200px;
  word-wrap: break-word;
}

.null-value {
  color: #dc3545;
  font-style: italic;
  font-weight: 500;
}

.long-text {
  cursor: help;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-style: italic;
}

.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5em;
  }
  
  .health-details,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .data-table th,
  .data-table td {
    padding: 6px 8px;
    font-size: 0.8em;
  }
  
  .health-card .card-header,
  .stats-card .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
}
</style>