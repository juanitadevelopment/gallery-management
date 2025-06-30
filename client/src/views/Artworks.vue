<template>
  <div class="artworks">
    <div class="page-header">
      <h1 class="page-title">絵画管理</h1>
      <button class="btn btn-primary" @click="showCreateModal = true">
        新規登録
      </button>
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
          :data="artworks"
          :columns="columns"
          :default-sort="{ key: 'created_at', direction: 'desc' }"
          empty-message="まだ絵画が登録されていません"
          @sort-change="onSortChange"
        >
          <template #cell-detail_url="{ value }">
            <a v-if="value" :href="value" target="_blank" class="detail-link">
              詳細を見る
            </a>
            <span v-else class="text-muted">-</span>
          </template>
          
          <template #cell-created_at="{ value }">
            {{ formatDateTime(value) }}
          </template>
          
          <template #cell-updated_at="{ value }">
            {{ formatDateTime(value) }}
          </template>

          <template #actions="{ item }">
            <button 
              class="btn btn-sm btn-secondary" 
              @click="editArtwork(item)"
              :disabled="loading"
            >
              編集
            </button>
            <button 
              class="btn btn-sm btn-danger" 
              @click="deleteArtwork(item)"
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
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">新しい絵画を登録</h3>
          <button class="modal-close" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createArtwork">
            <div class="form-group">
              <label class="form-label">タイトル *</label>
              <input 
                v-model="createForm.title"
                type="text" 
                class="form-input"
                required
                maxlength="255"
              />
              <div v-if="validationErrors.title" class="form-error">
                {{ validationErrors.title }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">作者名 *</label>
              <input 
                v-model="createForm.artist"
                type="text" 
                class="form-input"
                required
                maxlength="255"
              />
              <div v-if="validationErrors.artist" class="form-error">
                {{ validationErrors.artist }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">詳細URL</label>
              <input 
                v-model="createForm.detail_url"
                type="url" 
                class="form-input"
                placeholder="https://example.com/artwork-details"
              />
              <div v-if="validationErrors.detail_url" class="form-error">
                {{ validationErrors.detail_url }}
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeCreateModal">
                キャンセル
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? '登録中...' : '登録' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">絵画情報を編集</h3>
          <button class="modal-close" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateArtwork">
            <div class="form-group">
              <label class="form-label">タイトル *</label>
              <input 
                v-model="editForm.title"
                type="text" 
                class="form-input"
                required
                maxlength="255"
              />
              <div v-if="validationErrors.title" class="form-error">
                {{ validationErrors.title }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">作者名 *</label>
              <input 
                v-model="editForm.artist"
                type="text" 
                class="form-input"
                required
                maxlength="255"
              />
              <div v-if="validationErrors.artist" class="form-error">
                {{ validationErrors.artist }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">詳細URL</label>
              <input 
                v-model="editForm.detail_url"
                type="url" 
                class="form-input"
                placeholder="https://example.com/artwork-details"
              />
              <div v-if="validationErrors.detail_url" class="form-error">
                {{ validationErrors.detail_url }}
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

    <!-- Loading overlay -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import axios from 'axios'
import SortableTable from '@/components/SortableTable.vue'
import type { Artwork, CreateArtworkRequest, UpdateArtworkRequest, SortConfig } from '@/types'

const artworks = ref<Artwork[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingArtwork = ref<Artwork | null>(null)

const createForm = reactive({
  title: '',
  artist: '',
  detail_url: ''
})

const editForm = reactive({
  title: '',
  artist: '',
  detail_url: ''
})

const validationErrors = reactive({
  title: '',
  artist: '',
  detail_url: ''
})

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'title', label: 'タイトル', sortable: true },
  { key: 'artist', label: '作者名', sortable: true },
  { key: 'detail_url', label: '詳細URL', sortable: false },
  { key: 'created_at', label: '登録日時', sortable: true },
  { key: 'updated_at', label: '更新日時', sortable: true }
]

const fetchArtworks = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await axios.get('/api/artworks')
    artworks.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'データの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

const createArtwork = async () => {
  try {
    clearValidationErrors()
    loading.value = true
    
    const data: CreateArtworkRequest = {
      title: createForm.title.trim(),
      artist: createForm.artist.trim(),
      detail_url: createForm.detail_url.trim() || undefined
    }
    
    const response = await axios.post('/api/artworks', data)
    artworks.value.unshift(response.data)
    
    closeCreateModal()
    successMessage.value = '絵画を登録しました'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err: any) {
    if (err.response?.status === 400) {
      handleValidationError(err.response.data.error)
    } else {
      error.value = err.response?.data?.error || '登録に失敗しました'
    }
  } finally {
    loading.value = false
  }
}

const editArtwork = (artwork: Artwork) => {
  editingArtwork.value = artwork
  editForm.title = artwork.title
  editForm.artist = artwork.artist
  editForm.detail_url = artwork.detail_url || ''
  showEditModal.value = true
  clearValidationErrors()
}

const updateArtwork = async () => {
  if (!editingArtwork.value) return
  
  try {
    clearValidationErrors()
    loading.value = true
    
    const data: UpdateArtworkRequest = {
      title: editForm.title.trim(),
      artist: editForm.artist.trim(),
      detail_url: editForm.detail_url.trim() || undefined,
      updated_at: editingArtwork.value.updated_at
    }
    
    const response = await axios.put(`/api/artworks/${editingArtwork.value.id}`, data)
    
    const index = artworks.value.findIndex(a => a.id === editingArtwork.value!.id)
    if (index !== -1) {
      artworks.value[index] = response.data
    }
    
    closeEditModal()
    successMessage.value = '絵画情報を更新しました'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err: any) {
    if (err.response?.status === 400) {
      handleValidationError(err.response.data.error)
    } else if (err.response?.status === 409) {
      error.value = err.response.data.error
      closeEditModal()
      await fetchArtworks() // Refresh data
    } else {
      error.value = err.response?.data?.error || '更新に失敗しました'
    }
  } finally {
    loading.value = false
  }
}

const deleteArtwork = async (artwork: Artwork) => {
  if (!confirm(`「${artwork.title}」を削除しますか？`)) return
  
  try {
    loading.value = true
    await axios.delete(`/api/artworks/${artwork.id}`)
    
    artworks.value = artworks.value.filter(a => a.id !== artwork.id)
    successMessage.value = '絵画を削除しました'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.error || '削除に失敗しました'
  } finally {
    loading.value = false
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.title = ''
  createForm.artist = ''
  createForm.detail_url = ''
  clearValidationErrors()
}

const closeEditModal = () => {
  showEditModal.value = false
  editingArtwork.value = null
  clearValidationErrors()
}

const clearValidationErrors = () => {
  validationErrors.title = ''
  validationErrors.artist = ''
  validationErrors.detail_url = ''
}

const handleValidationError = (message: string) => {
  if (message.includes('タイトル')) {
    validationErrors.title = message
  } else if (message.includes('作者')) {
    validationErrors.artist = message
  } else if (message.includes('URL')) {
    validationErrors.detail_url = message
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

const onSortChange = (sortConfig: SortConfig) => {
  // Handle sort change if needed for external sorting
  console.log('Sort changed:', sortConfig)
}

onMounted(() => {
  fetchArtworks()
})
</script>

<style scoped>
.artworks {
  max-width: 1200px;
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

.detail-link {
  color: #007bff;
  text-decoration: none;
  font-size: 0.9em;
}

.detail-link:hover {
  text-decoration: underline;
}

.text-muted {
  color: #6c757d;
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
}
</style>