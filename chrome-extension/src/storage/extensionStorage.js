/**
 * Extension Storage Utility
 * Safe wrapper around chrome.storage.local with Promise support
 * and chrome.runtime.lastError safety.
 *
 * Supports:
 * 1. Chrome Extension runtime (chrome.storage.local)
 * 2. Web browser fallback (localStorage)
 * 3. Node/Test environment fallback (in-memory store)
 */

const DEFAULT_SETTINGS = {
  crmEndpoint: 'http://localhost:8080',
  workspaceId: 1,
  authToken: '',
  lastPingTimestamp: null,
  diagnosticResults: null,
}

// In-memory store for Node / unit test environments
let memoryStore = { ...DEFAULT_SETTINGS }

export const extensionStorage = {
  /**
   * Save a key-value pair or multiple pairs
   * @param {string|Object} key - String key or object with multiple key/value pairs
   * @param {any} [value] - Value to save if key is a string
   */
  async save(key, value) {
    return new Promise((resolve, reject) => {
      let data = {}
      if (typeof key === 'object' && key !== null) {
        data = key
      } else {
        data[key] = value
      }

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message))
          }
          resolve(true)
        })
      } else if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('crm_ext_storage')
          const current = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS }
          const updated = { ...current, ...data }
          localStorage.setItem('crm_ext_storage', JSON.stringify(updated))
          resolve(true)
        } catch (e) {
          reject(e)
        }
      } else {
        // Node / test memory fallback
        memoryStore = { ...memoryStore, ...data }
        resolve(true)
      }
    })
  },

  /**
   * Get value by key (or null for all defaults merged)
   * @param {string|string[]|null} [key]
   */
  async get(key = null) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const queryKey = key || null
        chrome.storage.local.get(queryKey, (result) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message))
          }
          if (key && typeof key === 'string') {
            resolve(result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key])
          } else {
            resolve({ ...DEFAULT_SETTINGS, ...result })
          }
        })
      } else if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('crm_ext_storage')
          const parsed = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS }
          if (key && typeof key === 'string') {
            resolve(parsed[key] !== undefined ? parsed[key] : DEFAULT_SETTINGS[key])
          } else {
            resolve({ ...DEFAULT_SETTINGS, ...parsed })
          }
        } catch (e) {
          reject(e)
        }
      } else {
        // Node / test memory fallback
        if (key && typeof key === 'string') {
          resolve(memoryStore[key] !== undefined ? memoryStore[key] : DEFAULT_SETTINGS[key])
        } else {
          resolve({ ...DEFAULT_SETTINGS, ...memoryStore })
        }
      }
    })
  },

  /**
   * Remove a key or array of keys from storage
   * @param {string|string[]} key
   */
  async remove(key) {
    return new Promise((resolve, reject) => {
      const keys = Array.isArray(key) ? key : [key]
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message))
          }
          resolve(true)
        })
      } else if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('crm_ext_storage')
          const parsed = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS }
          keys.forEach((k) => delete parsed[k])
          localStorage.setItem('crm_ext_storage', JSON.stringify(parsed))
          resolve(true)
        } catch (e) {
          reject(e)
        }
      } else {
        // Node / test memory fallback
        keys.forEach((k) => delete memoryStore[k])
        resolve(true)
      }
    })
  },

  /**
   * Clear all storage and reset defaults
   */
  async clear() {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message))
          }
          resolve(true)
        })
      } else if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem('crm_ext_storage')
          resolve(true)
        } catch (e) {
          reject(e)
        }
      } else {
        // Node / test memory fallback
        memoryStore = { ...DEFAULT_SETTINGS }
        resolve(true)
      }
    })
  },
}
