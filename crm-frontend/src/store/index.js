import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import themeReducer from './slices/themeSlice'
import notificationReducer from './slices/notificationSlice'
import workspaceReducer from './slices/workspaceSlice'
import chatReducer from './slices/chatSlice'
import presenceReducer from './slices/presenceSlice'
import crmReducer from './slices/crmSlice'
import pipelineReducer from './slices/pipelineSlice'
import analyticsReducer from './slices/analyticsSlice'
import aiReducer from './slices/aiSlice'
import copilotReducer from './slices/copilotSlice'
import sidebarReducer from './slices/sidebarSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    notifications: notificationReducer,
    workspace: workspaceReducer,
    chat: chatReducer,
    presence: presenceReducer,
    crm: crmReducer,
    pipeline: pipelineReducer,
    analytics: analyticsReducer,
    ai: aiReducer,
    copilot: copilotReducer,
    sidebar: sidebarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
