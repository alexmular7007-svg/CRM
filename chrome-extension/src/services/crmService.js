import { crmApi } from './crmApi.js'

/**
 * CRM Service - Wrapper/Alias for crmApi
 */
export const crmService = {
  pingHealth: () => crmApi.checkConnection(),
  fetchWorkspaceExtensions: () => crmApi.fetchExtensions(),
  ...crmApi,
}
