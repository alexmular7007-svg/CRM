/**
 * TaskFlow Learning Extension - Wikipedia Search Service
 * Handles safe construction of Wikipedia search URLs and opening browser tabs.
 */

const WIKIPEDIA_SEARCH_BASE = 'https://en.wikipedia.org/wiki/Special:Search'

/**
 * Builds an official, safely encoded Wikipedia search URL from text.
 * Trims surrounding whitespace and properly URL-encodes queries.
 *
 * @param {string} text - User selected or entered query text
 * @returns {string|null} Full safe Wikipedia URL or null if empty
 */
export function buildWikipediaSearchUrl(text) {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  if (!trimmed) return null

  const encodedQuery = encodeURIComponent(trimmed)
  return `${WIKIPEDIA_SEARCH_BASE}?search=${encodedQuery}`
}

/**
 * Executes a Wikipedia search by opening a new browser tab with the safely encoded URL.
 *
 * @param {string} text - Query text
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function searchWikipedia(text) {
  const url = buildWikipediaSearchUrl(text)
  if (!url) {
    return { success: false, error: 'Empty search query' }
  }

  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    return new Promise((resolve) => {
      chrome.tabs.create({ url }, (tab) => {
        resolve({ success: true, url, tabId: tab?.id })
      })
    })
  }

  return { success: true, url }
}
