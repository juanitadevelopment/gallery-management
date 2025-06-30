<template>
  <div class="sortable-table">
    <table class="table">
      <thead>
        <tr>
          <th 
            v-for="column in columns" 
            :key="column.key"
            @click="handleSort(column.key)"
            :class="{ 'sortable': column.sortable !== false }"
          >
            {{ column.label }}
            <span 
              v-if="column.sortable !== false"
              class="sort-icon"
              :class="{ 'active': sortConfig.key === column.key }"
            >
              <span v-if="sortConfig.key === column.key">
                {{ sortConfig.direction === 'asc' ? '▲' : '▼' }}
              </span>
              <span v-else>⇅</span>
            </span>
          </th>
          <th v-if="$slots.actions" class="actions-column">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in sortedData" :key="getItemKey(item)">
          <td v-for="column in columns" :key="column.key">
            <slot 
              :name="`cell-${column.key}`" 
              :item="item" 
              :value="getNestedValue(item, column.key)"
            >
              {{ formatCellValue(item, column) }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="actions-cell">
            <slot name="actions" :item="item"></slot>
          </td>
        </tr>
        <tr v-if="sortedData.length === 0">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="no-data">
            {{ emptyMessage }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SortConfig } from '@/types'

interface Column {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any, item: any) => string
}

interface Props {
  data: any[]
  columns: Column[]
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
  emptyMessage?: string
  itemKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'データがありません',
  itemKey: 'id'
})

const emit = defineEmits<{
  sortChange: [sortConfig: SortConfig]
}>()

const sortConfig = ref<SortConfig>({
  key: props.defaultSort?.key || '',
  direction: props.defaultSort?.direction || null
})

const handleSort = (key: string) => {
  const column = props.columns.find(col => col.key === key)
  if (column?.sortable === false) return

  if (sortConfig.value.key === key) {
    // Same column clicked - cycle through directions
    if (sortConfig.value.direction === 'asc') {
      sortConfig.value.direction = 'desc'
    } else if (sortConfig.value.direction === 'desc') {
      sortConfig.value.direction = null
      sortConfig.value.key = ''
    } else {
      sortConfig.value.direction = 'asc'
    }
  } else {
    // Different column clicked
    sortConfig.value.key = key
    sortConfig.value.direction = 'asc'
  }

  emit('sortChange', { ...sortConfig.value })
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const getItemKey = (item: any): string | number => {
  return getNestedValue(item, props.itemKey) || Math.random()
}

const formatCellValue = (item: any, column: Column): string => {
  const value = getNestedValue(item, column.key)
  
  if (column.formatter) {
    return column.formatter(value, item)
  }
  
  if (value === null || value === undefined) {
    return '-'
  }
  
  if (typeof value === 'boolean') {
    return value ? 'はい' : 'いいえ'
  }
  
  if (value instanceof Date) {
    return value.toLocaleDateString('ja-JP')
  }
  
  return String(value)
}

const sortedData = computed(() => {
  if (!sortConfig.value.key || !sortConfig.value.direction) {
    return props.data
  }

  const key = sortConfig.value.key
  const direction = sortConfig.value.direction

  return [...props.data].sort((a, b) => {
    const aValue = getNestedValue(a, key)
    const bValue = getNestedValue(b, key)

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) {
      if (bValue === null || bValue === undefined) return 0
      return direction === 'asc' ? 1 : -1
    }
    if (bValue === null || bValue === undefined) {
      return direction === 'asc' ? -1 : 1
    }

    // Handle different data types
    let comparison = 0
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      // String comparison (case-insensitive for Japanese)
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      comparison = aStr.localeCompare(bStr, 'ja-JP')
    }

    return direction === 'asc' ? comparison : -comparison
  })
})

// Watch for external sort changes
watch(() => props.defaultSort, (newSort) => {
  if (newSort) {
    sortConfig.value = {
      key: newSort.key,
      direction: newSort.direction
    }
  }
}, { immediate: true })
</script>

<style scoped>
.sortable-table {
  overflow-x: auto;
}

.table {
  min-width: 600px;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #e9ecef !important;
}

.sort-icon {
  margin-left: 8px;
  opacity: 0.5;
  font-size: 12px;
  display: inline-block;
  width: 12px;
  text-align: center;
}

.sort-icon.active {
  opacity: 1;
  color: #007bff;
}

.actions-column {
  width: 120px;
  text-align: center;
}

.actions-cell {
  text-align: center;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-style: italic;
}

/* Action buttons styling */
.actions-cell .btn {
  margin: 0 2px;
}

@media (max-width: 768px) {
  .table {
    font-size: 12px;
  }
  
  .sort-icon {
    margin-left: 4px;
  }
  
  .actions-column {
    width: 80px;
  }
}
</style>