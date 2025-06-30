<template>
  <div class="exhibitions">
    <div class="page-header">
      <h1 class="page-title">展示管理</h1>
      <button class="btn btn-primary" @click="showCreateModal = true">
        新規展示登録
      </button>
    </div>

    <div class="alert alert-error" v-if="error">
      {{ error }}
    </div>

    <div class="alert alert-success" v-if="successMessage">
      {{ successMessage }}
    </div>

    <!-- Filter controls -->
    <div class="card" style="margin-bottom: 20px;">
      <div class="card-body">
        <div class="filter-controls">
          <div class="form-group">
            <label class="form-label">ステータス</label>
            <select v-model="statusFilter" @change="fetchExhibitions" class="form-select">
              <option value="">すべて</option>
              <option value="scheduled">予定</option>
              <option value="active">展示中</option>
              <option value="completed">完了</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">現在展示中のみ</label>
            <input 
              type="checkbox" 
              v-model="currentOnly" 
              @change="fetchExhibitions"
              class="form-checkbox"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <SortableTable
          :data="exhibitions"
          :columns="columns"
          :default-sort="{ key: 'start_date', direction: 'desc' }"
          empty-message="まだ展示が登録されていません"
          @sort-change="onSortChange"
        >
          <template #cell-artwork="{ item }">
            <div class="artwork-info">
              <div class="artwork-title">{{ item.artwork?.title }}</div>
              <div class="artwork-artist">{{ item.artwork?.artist }}</div>
            </div>
          </template>
          
          <template #cell-location="{ item }">
            <div class="location-info">
              <div class="location-id">場所 {{ item.location_id }}</div>
              <div class="location-desc">{{ item.location?.description }}</div>
              <div class="location-size">
                {{ item.location?.width }}×{{ item.location?.height }}cm
              </div>
            </div>
          </template>
          
          <template #cell-period="{ item }">
            <div class="period-info">
              <div>{{ formatDate(item.start_date) }}</div>
              <div class="period-separator">〜</div>
              <div>{{ formatDate(item.end_date) }}</div>
              <div class="period-days">({{ calculateDays(item.start_date, item.end_date) }}日間)</div>
            </div>
          </template>
          
          <template #cell-status="{ value }">
            <span class="status-badge" :class="`status-${value}`">
              {{ getStatusLabel(value) }}
            </span>
          </template>
          
          <template #cell-notes="{ value }">
            <span v-if="value" class="notes" :title="value">{{ truncateText(value, 30) }}</span>
            <span v-else class="text-muted">-</span>
          </template>

          <template #actions="{ item }">
            <button 
              class="btn btn-sm btn-secondary" 
              @click="editExhibition(item)"
              :disabled="loading"
            >
              編集
            </button>
            <button 
              class="btn btn-sm btn-danger" 
              @click="deleteExhibition(item)"
              :disabled="loading"
            >
              削除
            </button>
          </template>
        </SortableTable>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3 class="modal-title">新しい展示を登録</h3>
          <button class="modal-close" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createExhibition">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">作品 *</label>
                <select v-model="createForm.artwork_id" class="form-select" required>
                  <option value="">作品を選択してください</option>
                  <option 
                    v-for="artwork in artworks" 
                    :key="artwork.id" 
                    :value="artwork.id"
                  >
                    {{ artwork.title }} - {{ artwork.artist }}
                  </option>
                </select>
                <div v-if="validationErrors.artwork_id" class="form-error">
                  {{ validationErrors.artwork_id }}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">場所 *</label>
                <select v-model="createForm.location_id" class="form-select" required>
                  <option value="">場所を選択してください</option>
                  <option 
                    v-for="location in locations" 
                    :key="location.id" 
                    :value="location.id"
                  >
                    場所 {{ location.id }} - {{ location.description }} ({{ location.width }}×{{ location.height }}cm)
                  </option>
                </select>
                <div v-if="validationErrors.location_id" class="form-error">
                  {{ validationErrors.location_id }}
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">開始日 *</label>
                <input 
                  v-model="createForm.start_date"
                  type="date" 
                  class="form-input"
                  required
                  @change="checkAvailability"
                />
                <div v-if="validationErrors.start_date" class="form-error">
                  {{ validationErrors.start_date }}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">終了日 *</label>
                <input 
                  v-model="createForm.end_date"
                  type="date" 
                  class="form-input"
                  required
                  @change="checkAvailability"
                />
                <div v-if="validationErrors.end_date" class="form-error">
                  {{ validationErrors.end_date }}
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">ステータス</label>
              <select v-model="createForm.status" class="form-select">
                <option value="scheduled">予定</option>
                <option value="active">展示中</option>
                <option value="completed">完了</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">備考</label>
              <textarea 
                v-model="createForm.notes"
                class="form-textarea"
                placeholder="展示に関するメモや特記事項"
                maxlength="1000"
              ></textarea>
            </div>
            
            <div v-if="availabilityMessage" class="availability-message" :class="availabilityClass">
              {{ availabilityMessage }}
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeCreateModal">
                キャンセル
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                :disabled="loading || !isAvailable"
              >
                {{ loading ? '登録中...' : '登録' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3 class="modal-title">展示情報を編集</h3>
          <button class="modal-close" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateExhibition">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">作品 *</label>
                <select v-model="editForm.artwork_id" class="form-select" required>
                  <option value="">作品を選択してください</option>
                  <option 
                    v-for="artwork in artworks" 
                    :key="artwork.id" 
                    :value="artwork.id"
                  >
                    {{ artwork.title }} - {{ artwork.artist }}
                  </option>
                </select>
                <div v-if="validationErrors.artwork_id" class="form-error">
                  {{ validationErrors.artwork_id }}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">場所 *</label>
                <select v-model="editForm.location_id" class="form-select" required>
                  <option value="">場所を選択してください</option>
                  <option 
                    v-for="location in locations" 
                    :key="location.id" 
                    :value="location.id"
                  >
                    場所 {{ location.id }} - {{ location.description }} ({{ location.width }}×{{ location.height }}cm)
                  </option>
                </select>
                <div v-if="validationErrors.location_id" class="form-error">
                  {{ validationErrors.location_id }}
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">開始日 *</label>
                <input 
                  v-model="editForm.start_date"
                  type="date" 
                  class="form-input"
                  required
                  @change="checkEditAvailability"
                />
                <div v-if="validationErrors.start_date" class="form-error">
                  {{ validationErrors.start_date }}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">終了日 *</label>
                <input 
                  v-model="editForm.end_date"
                  type="date" 
                  class="form-input"
                  required
                  @change="checkEditAvailability"
                />
                <div v-if="validationErrors.end_date" class="form-error">
                  {{ validationErrors.end_date }}
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">ステータス</label>
              <select v-model="editForm.status" class="form-select">
                <option value="scheduled">予定</option>
                <option value="active">展示中</option>
                <option value="completed">完了</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">備考</label>
              <textarea 
                v-model="editForm.notes"
                class="form-textarea"
                placeholder="展示に関するメモや特記事項"
                maxlength="1000"
              ></textarea>
            </div>
            
            <div v-if="editAvailabilityMessage" class="availability-message" :class="editAvailabilityClass">
              {{ editAvailabilityMessage }}
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">
                キャンセル
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                :disabled="loading || !isEditAvailable"
              >
                {{ loading ? '更新中...' : '更新' }}
              </button>
            </div>
          </form>
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
import { ref, onMounted, reactive, computed, watch } from 'vue'
import axios from 'axios'
import SortableTable from '@/components/SortableTable.vue'
import type { Exhibition, Artwork, Location, CreateExhibitionRequest, UpdateExhibitionRequest, SortConfig } from '@/types'

const exhibitions = ref<Exhibition[]>([])
const artworks = ref<Artwork[]>([])
const locations = ref<Location[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingExhibition = ref<Exhibition | null>(null)
const statusFilter = ref('')
const currentOnly = ref(false)
const isAvailable = ref(true)
const isEditAvailable = ref(true)
const availabilityMessage = ref('')
const editAvailabilityMessage = ref('')

const createForm = reactive({
  artwork_id: '',
  location_id: '',
  start_date: '',
  end_date: '',
  status: 'scheduled',
  notes: ''
})

const editForm = reactive({
  artwork_id: '',
  location_id: '',
  start_date: '',
  end_date: '',
  status: 'scheduled',
  notes: ''
})

const validationErrors = reactive({
  artwork_id: '',
  location_id: '',
  start_date: '',
  end_date: '',
  status: '',
  notes: ''
})

const columns = [
  { key: 'artwork', label: '作品', sortable: false },
  { key: 'location', label: '場所', sortable: false },
  { key: 'period', label: '展示期間', sortable: false },
  { key: 'status', label: 'ステータス', sortable: true },
  { key: 'notes', label: '備考', sortable: false }
]

const availabilityClass = computed(() => {
  return isAvailable.value ? 'alert-success' : 'alert-error'
})

const editAvailabilityClass = computed(() => {
  return isEditAvailable.value ? 'alert-success' : 'alert-error'
})

const fetchExhibitions = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const params: any = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (currentOnly.value) params.current = 'true'
    
    const response = await axios.get('/api/exhibitions', { params })
    exhibitions.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'データの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

const fetchArtworks = async () => {
  try {
    const response = await axios.get('/api/artworks')
    artworks.value = response.data
  } catch (err: any) {
    console.error('Failed to fetch artworks:', err)
  }
}

const fetchLocations = async () => {
  try {
    const response = await axios.get('/api/locations')
    locations.value = response.data
  } catch (err: any) {
    console.error('Failed to fetch locations:', err)
  }
}

const checkAvailability = async () => {
  if (!createForm.location_id || !createForm.start_date || !createForm.end_date) {
    availabilityMessage.value = ''
    isAvailable.value = true
    return
  }
  
  try {
    const response = await axios.get(`/api/locations/${createForm.location_id}/availability`, {
      params: {
        start_date: createForm.start_date,
        end_date: createForm.end_date
      }
    })
    
    isAvailable.value = response.data.available
    availabilityMessage.value = response.data.available 
      ? '指定期間は利用可能です' 
      : '指定期間は既に予約されています'
  } catch (err: any) {
    console.error('Failed to check availability:', err)
    isAvailable.value = false
    availabilityMessage.value = '空き状況の確認に失敗しました'
  }
}

const checkEditAvailability = async () => {
  if (!editForm.location_id || !editForm.start_date || !editForm.end_date || !editingExhibition.value) {
    editAvailabilityMessage.value = ''
    isEditAvailable.value = true
    return
  }
  
  try {
    const response = await axios.get(`/api/locations/${editForm.location_id}/availability`, {
      params: {
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        exclude_exhibition_id: editingExhibition.value.id
      }
    })
    
    isEditAvailable.value = response.data.available
    editAvailabilityMessage.value = response.data.available 
      ? '指定期間は利用可能です' 
      : '指定期間は既に予約されています'
  } catch (err: any) {
    console.error('Failed to check availability:', err)
    isEditAvailable.value = false
    editAvailabilityMessage.value = '空き状況の確認に失敗しました'
  }
}

const createExhibition = async () => {
  try {
    clearValidationErrors()
    loading.value = true
    
    if (new Date(createForm.start_date) >= new Date(createForm.end_date)) {
      validationErrors.end_date = '終了日は開始日より後である必要があります'
      return
    }
    
    const data: CreateExhibitionRequest = {
      artwork_id: Number(createForm.artwork_id),
      location_id: Number(createForm.location_id),
      start_date: createForm.start_date,
      end_date: createForm.end_date,
      status: createForm.status as any,
      notes: createForm.notes.trim() || undefined
    }
    
    const response = await axios.post('/api/exhibitions', data)
    
    await fetchExhibitions() // Refresh the list
    closeCreateModal()
    successMessage.value = '展示を登録しました'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err: any) {
    if (err.response?.status === 400) {
      handleValidationError(err.response.data.error)
    } else if (err.response?.status === 409) {
      error.value = err.response.data.error
    } else {
      error.value = err.response?.data?.error || '登録に失敗しました'
    }
  } finally {
    loading.value = false
  }
}

const editExhibition = (exhibition: Exhibition) => {
  editingExhibition.value = exhibition
  editForm.artwork_id = exhibition.artwork_id.toString()
  editForm.location_id = exhibition.location_id.toString()
  editForm.start_date = exhibition.start_date
  editForm.end_date = exhibition.end_date
  editForm.status = exhibition.status
  editForm.notes = exhibition.notes || ''
  showEditModal.value = true
  clearValidationErrors()
  editAvailabilityMessage.value = ''
}

const updateExhibition = async () => {
  if (!editingExhibition.value) return
  
  try {
    clearValidationErrors()
    loading.value = true
    
    if (new Date(editForm.start_date) >= new Date(editForm.end_date)) {
      validationErrors.end_date = '終了日は開始日より後である必要があります'
      return
    }
    
    const data: UpdateExhibitionRequest = {
      artwork_id: Number(editForm.artwork_id),
      location_id: Number(editForm.location_id),
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      status: editForm.status as any,
      notes: editForm.notes.trim() || undefined,
      updated_at: editingExhibition.value.updated_at
    }
    
    const response = await axios.put(`/api/exhibitions/${editingExhibition.value.id}`, data)
    
    await fetchExhibitions() // Refresh the list
    closeEditModal()
    successMessage.value = '展示情報を更新しました'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err: any) {
    if (err.response?.status === 400) {
      handleValidationError(err.response.data.error)
    } else if (err.response?.status === 409) {
      if (err.response.data.error.includes('更新されています')) {
        error.value = err.response.data.error
        closeEditModal()
        await fetchExhibitions() // Refresh data
      } else {
        error.value = err.response.data.error
      }
    } else {
      error.value = err.response?.data?.error || '更新に失敗しました'
    }
  } finally {
    loading.value = false
  }
}

const deleteExhibition = async (exhibition: Exhibition) => {
  if (!confirm(`展示「${exhibition.artwork?.title}」を削除しますか？`)) return
  
  try {
    loading.value = true
    await axios.delete(`/api/exhibitions/${exhibition.id}`)
    
    await fetchExhibitions()
    successMessage.value = '展示を削除しました'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.error || '削除に失敗しました'
  } finally {
    loading.value = false
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  Object.assign(createForm, {
    artwork_id: '',
    location_id: '',
    start_date: '',
    end_date: '',
    status: 'scheduled',
    notes: ''
  })
  clearValidationErrors()
  availabilityMessage.value = ''
  isAvailable.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingExhibition.value = null
  clearValidationErrors()
  editAvailabilityMessage.value = ''
  isEditAvailable.value = true
}

const clearValidationErrors = () => {
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key as keyof typeof validationErrors] = ''
  })
}

const handleValidationError = (message: string) => {
  error.value = message
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit'
  })
}

const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: '予定',
    active: '展示中',
    completed: '完了'
  }
  return labels[status] || status
}

const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const onSortChange = (sortConfig: SortConfig) => {
  console.log('Sort changed:', sortConfig)
}

// Watch for form changes to check availability
watch([() => createForm.location_id, () => createForm.start_date, () => createForm.end_date], () => {
  checkAvailability()
})

watch([() => editForm.location_id, () => editForm.start_date, () => editForm.end_date], () => {
  checkEditAvailability()
})

onMounted(async () => {
  await Promise.all([
    fetchExhibitions(),
    fetchArtworks(),
    fetchLocations()
  ])
})
</script>

<style scoped>
.exhibitions {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 2em;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.filter-controls {
  display: flex;
  gap: 20px;
  align-items: end;
}

.filter-controls .form-group {
  margin-bottom: 0;
}

.form-checkbox {
  width: auto;
  margin-left: 8px;
}

.modal-large {
  max-width: 700px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.artwork-info, .location-info {
  min-width: 0;
}

.artwork-title, .location-id {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.artwork-artist, .location-desc, .location-size {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 2px;
}

.period-info {
  text-align: center;
  min-width: 120px;
}

.period-separator {
  color: #666;
  margin: 2px 0;
}

.period-days {
  font-size: 0.8em;
  color: #666;
  margin-top: 4px;
}

.notes {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  cursor: help;
}

.text-muted {
  color: #6c757d;
}

.availability-message {
  padding: 8px 12px;
  border-radius: 4px;
  margin: 16px 0;
  font-size: 0.9em;
}

.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .page-title {
    font-size: 1.5em;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-large {
    width: 95vw;
  }
  
  .artwork-info, .location-info, .period-info {
    font-size: 0.9em;
  }
}
</style>