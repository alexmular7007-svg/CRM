import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  magnets: [],
  selectedMagnet: null,
  filters: {
    status: null,
    search: '',
  },
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  sorting: {
    sortBy: 'createdAt',
    sortDir: 'DESC',
  },
  isLoading: false,
  error: null,
}

const leadMagnetSlice = createSlice({
  name: 'leadMagnet',
  initialState,
  reducers: {
    // Magnets
    setMagnets: (state, action) => {
      state.magnets = action.payload
    },
    addMagnet: (state, action) => {
      state.magnets.unshift(action.payload)
    },
    updateMagnet: (state, action) => {
      const index = state.magnets.findIndex(m => m.id === action.payload.id)
      if (index !== -1) {
        state.magnets[index] = action.payload
      }
    },
    removeMagnet: (state, action) => {
      state.magnets = state.magnets.filter(m => m.id !== action.payload)
    },

    // Selection
    setSelectedMagnet: (state, action) => {
      state.selectedMagnet = action.payload
    },

    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },

    // Pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload
    },

    // Sorting
    setSorting: (state, action) => {
      state.sorting = { ...state.sorting, ...action.payload }
    },

    // Loading & Error
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },

    // Reset state
    resetLeadMagnetState: (state) => {
      return initialState
    },
  },
})

export const {
  setMagnets,
  addMagnet,
  updateMagnet,
  removeMagnet,
  setSelectedMagnet,
  setFilters,
  clearFilters,
  setPagination,
  setPage,
  setSorting,
  setLoading,
  setError,
  clearError,
  resetLeadMagnetState,
} = leadMagnetSlice.actions

export default leadMagnetSlice.reducer
