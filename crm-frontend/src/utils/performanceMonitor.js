/**
 * Performance Monitoring Utility
 * Measures critical startup timings and logs them to console and localStorage
 */

class PerformanceMonitor {
  constructor() {
    this.marks = {}
    this.measurements = {}
    this.navStart = performance.navigation.type === 1 ? performance.now() - (performance.now() - window.performance.timeOrigin) : 0
  }

  /**
   * Mark a timestamp for a critical event
   */
  mark(label) {
    const timestamp = performance.now()
    this.marks[label] = timestamp
    console.log(`[PERF] ${label}: ${timestamp.toFixed(2)}ms`)
    return timestamp
  }

  /**
   * Measure time between two marks
   */
  measure(label, startMark, endMark) {
    if (!this.marks[startMark] || !this.marks[endMark]) {
      console.warn(`[PERF] Cannot measure ${label}: missing marks`)
      return null
    }
    const duration = this.marks[endMark] - this.marks[startMark]
    this.measurements[label] = duration
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }

  /**
   * Get full performance report
   */
  getReport() {
    return {
      marks: this.marks,
      measurements: this.measurements,
      navigationTiming: {
        dns: performance.timing?.domainLookupEnd - performance.timing?.domainLookupStart,
        tcp: performance.timing?.connectEnd - performance.timing?.connectStart,
        ttfb: performance.timing?.responseStart - performance.timing?.navigationStart,
        dom: performance.timing?.domContentLoadedEventEnd - performance.timing?.navigationStart,
        load: performance.timing?.loadEventEnd - performance.timing?.navigationStart,
      },
    }
  }

  /**
   * Save report to localStorage and log it
   */
  saveReport() {
    const report = this.getReport()
    localStorage.setItem('__perf_report', JSON.stringify(report, null, 2))
    console.table(report.marks)
    console.table(report.measurements)
    console.table(report.navigationTiming)
    return report
  }

  /**
   * Clear all marks and measurements
   */
  clear() {
    this.marks = {}
    this.measurements = {}
  }
}

export const perfMonitor = new PerformanceMonitor()

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  window.__perfMonitor = perfMonitor
}

export default perfMonitor
