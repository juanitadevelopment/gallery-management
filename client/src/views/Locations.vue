<template>
  <div class="locations">
    <div class="page-header">
      <h1 class="page-title">場所管理</h1>
      <p class="page-description">ギャラリーの展示場所を管理します</p>
    </div>

    <div class="alert alert-error" v-if="error">
      {{ error }}
    </div>

    <div class="alert alert-success" v-if="successMessage">
      {{ successMessage }}
    </div>

    <div class="card">
      <div class="card-body">
        <SortableTable
          :data="locations"
          :columns="columns"
          :default-sort="{ key: 'id', direction: 'asc' }"
          empty-message="場所データがありません"
          @sort-change="onSortChange"
        >
          <template #cell-size="{ item }">
            {{ item.width }}×{{ item.height }}cm
          </template>
          
          <template #cell-description="{ value }">
            <span v-if="value" class="description">{{ value }}</span>
            <span v-else class="text-muted">-</span>
          </template>
          
          <template #cell-updated_at="{ value }">
            {{ formatDateTime(value) }}
          </template>

          <template #actions="{ item }">
            <button 
              class="btn btn-sm btn-secondary" 
              @click="editLocation(item)"
              :disabled="loading"
            >
              編集
            </button>
            <button 
              class="btn btn-sm btn-primary" 
              @click="viewSchedule(item)"
              :disabled="loading"
            >
              スケジュール
            </button>
          </template>
        </SortableTable>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">場所 {{ editingLocation?.id }} を編集</h3>
          <button class="modal-close" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateLocation">
            <div class="form-group">
              <label class="form-label">幅 (cm) *</label>
              <input 
                v-model.number="editForm.width"
                type="number" 
                class="form-input"
                required
                min="1"
                max="1000"
              />
              <div v-if="validationErrors.width" class="form-error">
                {{ validationErrors.width }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">高さ (cm) *</label>
              <input 
                v-model.number="editForm.height"
                type="number" 
                class="form-input"
                required
                min="1"
                max="1000"
              />
              <div v-if="validationErrors.height" class="form-error">
                {{ validationErrors.height }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">説明</label>
              <textarea 
                v-model="editForm.description"
                class="form-textarea"
                placeholder="場所の説明や特徴を入力"
                maxlength="500"
              ></textarea>
              <div v-if="validationErrors.description" class="form-error">
                {{ validationErrors.description }}
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">
                キャンセル
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? '更新中...' : '更新' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Schedule Modal -->
    <div v-if="showScheduleModal" class="modal-overlay" @click.self="closeScheduleModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3 class="modal-title">
            場所 {{ selectedLocation?.id }} のスケジュール
            <span class="location-info">
              ({{ selectedLocation?.width }}×{{ selectedLocation?.height }}cm)
            </span>
          </h3>
          <button class="modal-close" @click="closeScheduleModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedLocation?.description" class="location-description">
            {{ selectedLocation.description }}
          </div>
          
          <div class="schedule-controls">
            <div class="form-group">
              <label class="form-label">表示期間</label>
              <div class="date-controls">
                <select v-model="scheduleYear" @change="fetchSchedule" class="form-select">
                  <option v-for="year in availableYears" :key="year" :value="year">
                    {{ year }}年
                  </option>
                </select>
                <select v-model="scheduleMonth" @change="fetchSchedule" class="form-select">
                  <option v-for="month in 12" :key="month" :value="month">
                    {{ month }}月
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div v-if="scheduleLoading" class="loading">
            <div class="spinner"></div>
            <p>スケジュールを読み込み中...</p>
          </div>
          
          <div v-else-if="locationSchedule.length === 0" class="no-schedule">
            指定された期間に展示予定はありません
          </div>
          
          <div v-else class="schedule-list">
            <div 
              v-for="exhibition in locationSchedule" 
              :key="exhibition.id"
              class="schedule-item"
              :class="`status-${exhibition.status}`"
            >
              <div class="exhibition-header">
                <h4 class="exhibition-title">{{ exhibition.artwork_title }}</h4>
                <span class="status-badge" :class="`status-${exhibition.status}`">
                  {{ getStatusLabel(exhibition.status) }}
                </span>
              </div>
              <div class="exhibition-details">
                <p class="artist">作者: {{ exhibition.artwork_artist }}</p>
                <p class="period">
                  {{ formatDate(exhibition.start_date) }} 〜 {{ formatDate(exhibition.end_date) }}
                </p>
                <p v-if="exhibition.notes" class="notes">{{ exhibition.notes }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeScheduleModal">閉じる</button>
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import axios from 'axios'
import SortableTable from '@/components/SortableTable.vue'
import type { Location, UpdateLocationRequest, SortConfig } from '@/types'

const locations = ref<Location[]>([])
const loading = ref(false)
const scheduleLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const showEditModal = ref(false)
const showScheduleModal = ref(false)
const editingLocation = ref<Location | null>(null)
const selectedLocation = ref<Location | null>(null)
const locationSchedule = ref<any[]>([])
const scheduleYear = ref(new Date().getFullYear())
const scheduleMonth = ref(new Date().getMonth() + 1)

const editForm = reactive({
  width: 0,
  height: 0,
  description: ''
})

const validationErrors = reactive({
  width: '',
  height: '',
  description: ''
})

const columns = [
  { key: 'id', label: '場所ID', sortable: true },
  { key: 'size', label: 'サイズ', sortable: false },
  { key: 'description', label: '説明', sortable: true },
  { key: 'updated_at', label: '更新日時', sortable: true }
]

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})

const fetchLocations = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await axios.get('/api/locations')
    locations.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'データの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

const editLocation = (location: Location) => {
  editingLocation.value = location
  editForm.width = location.width
  editForm.height = location.height
  editForm.description = location.description || ''
  showEditModal.value = true
  clearValidationErrors()
}

const updateLocation = async () => {
  if (!editingLocation.value) return
  
  try {
    clearValidationErrors()
    loading.value = true
    
    const data: UpdateLocationRequest = {
      width: editForm.width,
      height: editForm.height,
      description: editForm.description.trim() || undefined,
      updated_at: editingLocation.value.updated_at
    }
    
    const response = await axios.put(`/api/locations/${editingLocation.value.id}`, data)
    
    const index = locations.value.findIndex(l => l.id === editingLocation.value!.id)
    if (index !== -1) {
      locations.value[index] = response.data
    }
    
    closeEditModal()
    successMessage.value = '場所情報を更新しました'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err: any) {
    if (err.response?.status === 400) {
      handleValidationError(err.response.data.error)
    } else if (err.response?.status === 409) {
      error.value = err.response.data.error
      closeEditModal()
      await fetchLocations() // Refresh data
    } else {
      error.value = err.response?.data?.error || '更新に失敗しました'
    }
  } finally {
    loading.value = false
  }
}

const viewSchedule = async (location: Location) => {
  selectedLocation.value = location
  showScheduleModal.value = true
  await fetchSchedule()
}

const fetchSchedule = async () => {
  if (!selectedLocation.value) return
  
  try {
    scheduleLoading.value = true
    const response = await axios.get(`/api/locations/${selectedLocation.value.id}/schedule`, {
      params: {
        year: scheduleYear.value,
        month: scheduleMonth.value
      }
    })
    locationSchedule.value = response.data
  } catch (err: any) {
    console.error('Failed to fetch schedule:', err)
  } finally {
    scheduleLoading.value = false
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editingLocation.value = null
  clearValidationErrors()
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
  selectedLocation.value = null
  locationSchedule.value = []
}

const clearValidationErrors = () => {
  validationErrors.width = ''
  validationErrors.height = ''
  validationErrors.description = ''
}

const handleValidationError = (message: string) => {
  if (message.includes('幅')) {
    validationErrors.width = message
  } else if (message.includes('高さ')) {
    validationErrors.height = message
  } else if (message.includes('説明')) {
    validationErrors.description = message
  } else {
    error.value = message
  }
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: '予定',
    active: '展示中',
    completed: '完了'
  }
  return labels[status] || status
}

const onSortChange = (sortConfig: SortConfig) => {
  console.log('Sort changed:', sortConfig)
}

onMounted(() => {
  fetchLocations()
})
</script>

<style scoped>
.locations {
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

.description {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.text-muted {
  color: #6c757d;
}

.modal-large {
  max-width: 800px;
}

.location-info {
  font-size: 0.8em;
  color: #666;
  font-weight: normal;
}

.location-description {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  color: #333;
}

.schedule-controls {
  margin-bottom: 20px;
}

.date-controls {
  display: flex;
  gap: 12px;
}

.date-controls .form-select {
  flex: 1;
}

.no-schedule {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-style: italic;
}

.schedule-list {
  max-height: 400px;
  overflow-y: auto;
}

.schedule-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s ease;
}

.schedule-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.schedule-item.status-active {
  border-left: 4px solid #28a745;
}

.schedule-item.status-scheduled {
  border-left: 4px solid #ffc107;
}

.schedule-item.status-completed {
  border-left: 4px solid #17a2b8;
}

.exhibition-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.exhibition-title {
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.exhibition-details p {
  margin: 4px 0;
  color: #666;
}

.artist {
  font-weight: 500;
  color: #333;
}

.period {
  font-size: 0.9em;
}

.notes {
  font-size: 0.9em;
  font-style: italic;
  color: #555;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
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

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5em;
  }
  
  .modal-large {
    width: 95vw;
  }
  
  .date-controls {
    flex-direction: column;
  }
  
  .exhibition-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .status-badge {
    align-self: flex-start;
  }
}
</style>