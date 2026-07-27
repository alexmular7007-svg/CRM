import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  leads: [],
  selectedLead: null,
  filters: {
    status: null,
    assignedToId: null,
    priority: null,
    search: ''
  },
  analytics: null,
  viewMode: 'pipeline', // 'pipeline' or 'list'
}

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    setLeads: (state, action) => {
      state.leads = action.payload
    },
    addLead: (state, action) => {
      state.leads.unshift(action.payload)
    },
    updateLead: (state, action) => {
      const index = state.leads.findIndex(lead => lead.id === action.payload.id)
      if (index !== -1) {
        state.leads[index] = action.payload
      }
    },
    removeLead: (state, action) => {
      state.leads = state.leads.filter(lead => lead.id !== action.payload)
    },
    setSelectedLead: (state, action) => {
      state.selectedLead = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    setAnalytics: (state, action) => {
      state.analytics = action.payload
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload
    },
    // Optimistic update for drag and drop
    optimisticUpdateLeadStatus: (state, action) => {
      const { leadId, newStatus } = action.payload
      const lead = state.leads.find(l => l.id === leadId)
      if (lead) {
        lead.status = newStatus
      }
    },
    // Feature #1: Mark lead as converted
    markLeadAsConverted: (state, action) => {
      const { leadId, convertedProjectId, convertedClientId, convertedAt } = action.payload
      const lead = state.leads.find(l => l.id === leadId)
      if (lead) {
        lead.converted = true
        lead.convertedAt = convertedAt
        lead.convertedProjectId = convertedProjectId
        lead.convertedClientId = convertedClientId
      }
    },
  },
})

export const {
  setLeads,
  addLead,
  updateLead,
  removeLead,
  setSelectedLead,
  setFilters,
  clearFilters,
  setAnalytics,
  setViewMode,
  optimisticUpdateLeadStatus,
  markLeadAsConverted,
} = crmSlice.actions

export default crmSlice.reducer
