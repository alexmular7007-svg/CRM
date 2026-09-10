/**
 * TaskFlow CRM - Quick Task Manager Popup Controller
 * Lightweight, direct Manifest V3 popup script.
 * Architecture: popup.js -> background.js -> crmApi.js -> REST API
 */

document.addEventListener('DOMContentLoaded', async () => {
  // --- DOM Elements ---
  const authPanel = document.getElementById('auth-panel')
  const mainPanel = document.getElementById('main-panel')
  const formLogin = document.getElementById('form-login')
  const loginEmail = document.getElementById('login-email')
  const loginPassword = document.getElementById('login-password')
  const loginErrorAlert = document.getElementById('login-error-alert')
  const btnSubmitLogin = document.getElementById('btn-submit-login')
  const btnSignOut = document.getElementById('btn-sign-out')
  const userDisplayName = document.getElementById('user-display-name')

  // Top Bar & Workspace Switcher
  const workspaceSwitcher = document.getElementById('workspace-switcher')
  const taskCountBadge = document.getElementById('task-count-badge')
  const btnShowCreateForm = document.getElementById('btn-show-create-form')

  // Create Task Drawer
  const createTaskDrawer = document.getElementById('create-task-drawer')
  const btnCloseCreateDrawer = document.getElementById('btn-close-create-drawer')
  const btnCancelCreate = document.getElementById('btn-cancel-create')
  const formCreateTask = document.getElementById('form-create-task')
  const newTaskTitle = document.getElementById('new-task-title')
  const newTaskDesc = document.getElementById('new-task-desc')
  const newTaskAssignee = document.getElementById('new-task-assignee')
  const newTaskPriority = document.getElementById('new-task-priority')
  const newTaskDueDate = document.getElementById('new-task-duedate')
  const btnSubmitCreateTask = document.getElementById('btn-submit-create-task')
  const createErrorAlert = document.getElementById('create-error-alert')

  // Task List & States
  const taskItemsContainer = document.getElementById('task-items')
  const stateLoading = document.getElementById('state-loading')
  const stateEmpty = document.getElementById('state-empty')
  const btnCreateFirstTask = document.getElementById('btn-create-first-task')
  const btnRefreshTasks = document.getElementById('btn-refresh-tasks')

  // Recent Activity
  const recentActivitySection = document.getElementById('recent-activity-section')
  const activityItemsContainer = document.getElementById('activity-items')
  const activityCountBadge = document.getElementById('activity-count-badge')
  const activityEmpty = document.getElementById('activity-empty')

  // Toast
  const toast = document.getElementById('toast')
  const toastMessage = document.getElementById('toast-message')
  let toastTimer = null

  // Local state
  let currentWorkspaceId = null
  let cachedMembers = []

  // --- 1. Hello World Verification (Phase 1) ---
  try {
    const helloRes = await chrome.runtime.sendMessage({ type: 'HELLO_WORLD' })
    if (helloRes && helloRes.message) {
      console.log('[TaskFlow CRM] Phase 1 Hello World OK:', helloRes.message)
    }
  } catch (err) {
    console.warn('[TaskFlow CRM] Background greeting ping:', err.message)
  }

  // --- 2. Initialize Session ---
  await initSession()

  async function initSession() {
    try {
      const authRes = await chrome.runtime.sendMessage({ type: 'GET_AUTH' })
      const authData = authRes?.data || {}

      if (authData.authenticated && authData.user) {
        showAuthenticatedView(authData.user, authData.workspaceId, authData.availableWorkspaces)
      } else {
        showLoginView()
      }
    } catch (err) {
      console.warn('Session init error:', err)
      showLoginView()
    }
  }

  function showLoginView(errorMsg = null) {
    authPanel.classList.remove('hidden')
    mainPanel.classList.add('hidden')
    btnSignOut.classList.add('hidden')
    userDisplayName.textContent = ''
    if (errorMsg) {
      loginErrorAlert.textContent = errorMsg
      loginErrorAlert.classList.remove('hidden')
    } else {
      loginErrorAlert.classList.add('hidden')
    }
  }

  function showAuthenticatedView(user, activeWsId = null, workspaces = []) {
    authPanel.classList.add('hidden')
    mainPanel.classList.remove('hidden')
    btnSignOut.classList.remove('hidden')

    const displayName = user?.fullName || user?.email || 'User'
    userDisplayName.textContent = displayName

    setupWorkspaceSwitcher(workspaces, activeWsId)
  }

  // --- 3. Workspace Switcher Setup ---
  async function setupWorkspaceSwitcher(workspaces = [], activeWsId = null) {
    workspaceSwitcher.innerHTML = ''

    // If workspaces list is empty, fetch fresh from API
    if (!workspaces || workspaces.length === 0) {
      try {
        const wsRes = await chrome.runtime.sendMessage({ type: 'GET_WORKSPACES' })
        if (wsRes && wsRes.success) {
          workspaces = wsRes.data || []
        }
      } catch (err) {
        console.warn('Failed to load workspaces:', err)
      }
    }

    if (!workspaces || workspaces.length === 0) {
      const opt = document.createElement('option')
      opt.value = ''
      opt.textContent = 'No workspaces'
      workspaceSwitcher.appendChild(opt)
      workspaceSwitcher.disabled = true
      return
    }

    workspaceSwitcher.disabled = false
    workspaces.forEach((ws) => {
      const opt = document.createElement('option')
      opt.value = ws.id.toString()
      opt.textContent = ws.name || `Workspace #${ws.id}`
      workspaceSwitcher.appendChild(opt)
    })

    // Select active workspace
    const targetWsId = activeWsId || workspaces[0]?.id
    currentWorkspaceId = targetWsId
    if (targetWsId) {
      workspaceSwitcher.value = targetWsId.toString()
      await onWorkspaceSelected(targetWsId)
    }
  }

  // Handle Workspace Switch
  workspaceSwitcher.addEventListener('change', async (e) => {
    const selectedWs = e.target.value ? parseInt(e.target.value, 10) : null
    currentWorkspaceId = selectedWs
    // Save to storage
    await chrome.runtime.sendMessage({
      type: 'SWITCH_WORKSPACE',
      workspaceId: selectedWs,
    })
    await onWorkspaceSelected(selectedWs)
  })

  async function onWorkspaceSelected(workspaceId) {
    if (!workspaceId) {
      showEmptyTasks('Please select a workspace')
      return
    }

    // Immediately clear old workspace data for clean isolation
    cachedMembers = []
    taskItemsContainer.innerHTML = ''
    activityItemsContainer.innerHTML = ''
    newTaskAssignee.innerHTML = '<option value="">Unassigned</option>'
    taskCountBadge.textContent = '0'
    activityCountBadge.textContent = '0'

    showLoadingTasks()

    // Parallel load: Tasks, Members, Recent Activity
    await Promise.all([
      loadTasks(workspaceId),
      loadMembers(workspaceId),
      loadRecentActivities(workspaceId),
    ])
  }

  // --- 4. Login Form Submission ---
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault()
    loginErrorAlert.classList.add('hidden')
    btnSubmitLogin.disabled = true
    btnSubmitLogin.textContent = 'Signing In...'

    const email = (loginEmail.value || '').trim()
    const password = loginPassword.value || ''

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOGIN',
        email,
        password,
      })

      if (response && response.success && response.data) {
        formLogin.reset()
        const { user, workspaces, selectedWorkspaceId } = response.data
        showAuthenticatedView(user, selectedWorkspaceId, workspaces)
      } else {
        showLoginView(response?.error || 'Sign in failed. Please check your credentials.')
      }
    } catch (err) {
      showLoginView(err.message || 'Error communicating with background worker.')
    } finally {
      btnSubmitLogin.disabled = false
      btnSubmitLogin.textContent = 'Sign In'
    }
  })

  // Sign Out Handler
  btnSignOut.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' })
    currentWorkspaceId = null
    cachedMembers = []
    taskItemsContainer.innerHTML = ''
    showLoginView()
  })

  // --- 5. Task CRUD: Load Tasks ---
  async function loadTasks(workspaceId = currentWorkspaceId) {
    if (!workspaceId) return

    showLoadingTasks()

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TASKS',
        workspaceId,
      })

      if (response && response.success) {
        const tasks = Array.isArray(response.data) ? response.data : []
        renderTaskList(tasks)
      } else {
        showEmptyTasks(response?.error || 'Unable to load tasks.')
      }
    } catch (err) {
      showEmptyTasks(err.message || 'Error loading tasks.')
    }
  }

  function renderTaskList(tasks) {
    stateLoading.classList.add('hidden')
    taskCountBadge.textContent = tasks.length.toString()

    if (tasks.length === 0) {
      stateEmpty.classList.remove('hidden')
      taskItemsContainer.classList.add('hidden')
      return
    }

    stateEmpty.classList.add('hidden')
    taskItemsContainer.classList.remove('hidden')
    taskItemsContainer.innerHTML = ''

    tasks.forEach((task) => {
      const row = createTaskRow(task)
      taskItemsContainer.appendChild(row)
    })
  }

  function createTaskRow(task) {
    const li = document.createElement('li')
    li.className = 'task-row'
    li.dataset.taskId = task.id
    const isDone = task.status === 'DONE'

    if (isDone) {
      li.classList.add('task-done')
    }

    const priority = (task.priority || 'MEDIUM').toUpperCase()
    const priorityClass = `priority-${priority.toLowerCase()}`
    const assigneeName = task.assignedTo?.fullName || task.assignedToName || 'Unassigned'
    const statusText = isDone ? 'COMPLETE' : 'TODO'
    const statusPillClass = isDone ? 'pill-complete' : 'pill-todo'

    li.innerHTML = `
      <button type="button" class="btn-toggle-status ${isDone ? 'completed' : ''}" title="${isDone ? 'Mark TODO' : 'Mark Complete'}" aria-label="Toggle task status">
        <svg class="status-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
      <div class="task-body">
        <span class="task-title">${escapeHtml(task.title || 'Untitled Task')}</span>
        <div class="task-meta">
          <span class="priority-tag ${priorityClass}">${priority}</span>
          <span>·</span>
          <span class="task-assignee">${escapeHtml(assigneeName)}</span>
          <span>·</span>
          <span class="task-status-pill ${statusPillClass}">${statusText}</span>
        </div>
      </div>
      <button type="button" class="btn-delete-task" title="Delete task" aria-label="Delete task">
        <svg class="delete-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
        </svg>
      </button>
    `

    // Status toggle event
    const btnToggle = li.querySelector('.btn-toggle-status')
    btnToggle.addEventListener('click', async (e) => {
      e.stopPropagation()
      const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
      btnToggle.disabled = true

      try {
        const res = await chrome.runtime.sendMessage({
          type: 'UPDATE_TASK_STATUS',
          taskId: task.id,
          status: newStatus,
          workspaceId: currentWorkspaceId,
        })

        if (res && res.success) {
          task.status = newStatus
          const nowDone = newStatus === 'DONE'
          li.classList.toggle('task-done', nowDone)
          btnToggle.classList.toggle('completed', nowDone)
          btnToggle.title = nowDone ? 'Mark TODO' : 'Mark Complete'

          const pill = li.querySelector('.task-status-pill')
          if (pill) {
            pill.textContent = nowDone ? 'COMPLETE' : 'TODO'
            pill.className = `task-status-pill ${nowDone ? 'pill-complete' : 'pill-todo'}`
          }

          showToast(nowDone ? 'Task marked complete!' : 'Task reopened to TODO')
          loadRecentActivities(currentWorkspaceId)
        } else {
          showToast(res?.error || 'Failed to update status')
        }
      } catch (err) {
        showToast(err.message || 'Error updating task status')
      } finally {
        btnToggle.disabled = false
      }
    })

    // Delete task event
    const btnDelete = li.querySelector('.btn-delete-task')
    btnDelete.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (!confirm('Delete this task?')) return
      btnDelete.disabled = true

      try {
        const res = await chrome.runtime.sendMessage({
          type: 'DELETE_TASK',
          taskId: task.id,
          workspaceId: currentWorkspaceId,
        })

        if (res && res.success) {
          li.remove()
          showToast('Task deleted.')
          loadRecentActivities(currentWorkspaceId)
        } else {
          showToast(res?.error || 'Failed to delete task')
        }
      } catch (err) {
        showToast(err.message || 'Error deleting task')
      }
    })

    return li
  }

  function showLoadingTasks() {
    stateLoading.classList.remove('hidden')
    stateEmpty.classList.add('hidden')
    taskItemsContainer.classList.add('hidden')
  }

  function showEmptyTasks(msg = null) {
    stateLoading.classList.add('hidden')
    taskItemsContainer.classList.add('hidden')
    stateEmpty.classList.remove('hidden')
    if (msg) {
      const title = stateEmpty.querySelector('.empty-title')
      if (title) title.textContent = msg
    }
  }

  // --- 6. Task Assignment: Load Members ---
  async function loadMembers(workspaceId = currentWorkspaceId) {
    if (!workspaceId) return
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_MEMBERS',
        workspaceId,
      })

      if (response && response.success) {
        cachedMembers = Array.isArray(response.data) ? response.data : []
        populateAssigneeDropdown(cachedMembers)
      }
    } catch (err) {
      console.warn('Failed to load workspace members:', err)
    }
  }

  function populateAssigneeDropdown(members) {
    newTaskAssignee.innerHTML = '<option value="">Unassigned</option>'
    members.forEach((m) => {
      const opt = document.createElement('option')
      const memberId = m.userId || m.id || ''
      opt.value = memberId.toString()
      opt.textContent = `${m.userName || m.userEmail || `User #${memberId}`} (${m.role || 'MEMBER'})`
      newTaskAssignee.appendChild(opt)
    })
  }

  // --- 7. Task Assignment: Create Form ---
  function openCreateDrawer() {
    createTaskDrawer.classList.remove('hidden')
    createErrorAlert.classList.add('hidden')
    newTaskTitle.focus()
  }

  function closeCreateDrawer() {
    createTaskDrawer.classList.add('hidden')
    formCreateTask.reset()
    createErrorAlert.classList.add('hidden')
  }

  btnShowCreateForm.addEventListener('click', openCreateDrawer)
  btnCreateFirstTask.addEventListener('click', openCreateDrawer)
  btnCloseCreateDrawer.addEventListener('click', closeCreateDrawer)
  btnCancelCreate.addEventListener('click', closeCreateDrawer)

  formCreateTask.addEventListener('submit', async (e) => {
    e.preventDefault()
    createErrorAlert.classList.add('hidden')

    const title = (newTaskTitle.value || '').trim()
    if (!title) {
      createErrorAlert.textContent = 'Title is required.'
      createErrorAlert.classList.remove('hidden')
      return
    }

    if (!currentWorkspaceId) {
      createErrorAlert.textContent = 'Please select a workspace.'
      createErrorAlert.classList.remove('hidden')
      return
    }

    btnSubmitCreateTask.disabled = true
    btnSubmitCreateTask.textContent = 'Assigning...'

    const taskPayload = {
      workspaceId: currentWorkspaceId,
      title,
      description: (newTaskDesc.value || '').trim() || null,
      priority: newTaskPriority.value || 'MEDIUM',
      dueDate: newTaskDueDate.value || null,
      assignedToId: newTaskAssignee.value ? parseInt(newTaskAssignee.value, 10) : null,
      status: 'TODO',
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_TASK',
        taskData: taskPayload,
      })

      if (response && response.success) {
        showToast('Task assigned successfully!')
        closeCreateDrawer()
        await Promise.all([
          loadTasks(currentWorkspaceId),
          loadRecentActivities(currentWorkspaceId),
        ])
      } else {
        createErrorAlert.textContent = response?.error || 'Failed to assign task.'
        createErrorAlert.classList.remove('hidden')
      }
    } catch (err) {
      createErrorAlert.textContent = err.message || 'Error creating task.'
      createErrorAlert.classList.remove('hidden')
    } finally {
      btnSubmitCreateTask.disabled = false
      btnSubmitCreateTask.textContent = 'Assign Task'
    }
  })

  // --- 8. Recent Activity Feed ---
  async function loadRecentActivities(workspaceId = currentWorkspaceId) {
    if (!workspaceId) return

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_RECENT_ACTIVITY',
        workspaceId,
        limit: 8,
      })

      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        renderActivities(response.data)
      } else {
        showEmptyActivities()
      }
    } catch (err) {
      showEmptyActivities()
    }
  }

  function renderActivities(activities) {
    activityEmpty.classList.add('hidden')
    activityItemsContainer.innerHTML = ''
    activityCountBadge.textContent = activities.length.toString()

    activities.forEach((act) => {
      const li = document.createElement('li')
      li.className = 'activity-item'

      const desc = (act.description || '').toUpperCase()
      const isDone = desc.includes('DONE') || desc.includes('COMPLETE')
      const isNew = desc.includes('CREATE')

      const iconClass = isDone ? 'act-icon-done' : (isNew ? 'act-icon-new' : 'act-icon-update')
      const iconSvg = isDone
        ? '<polyline points="20 6 9 17 4 12"></polyline>'
        : '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'

      li.innerHTML = `
        <div class="act-icon ${iconClass}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px;">
            ${iconSvg}
          </svg>
        </div>
        <div class="act-body">
          <p class="act-text">${escapeHtml(act.title || 'Task Activity')}</p>
          <div class="act-sub">
            <span>${escapeHtml(act.createdBy || 'User')}</span>
            <span>${formatRelativeTime(act.timestamp)}</span>
          </div>
        </div>
      `
      activityItemsContainer.appendChild(li)
    })
  }

  function showEmptyActivities() {
    activityItemsContainer.innerHTML = ''
    activityEmpty.classList.remove('hidden')
    activityCountBadge.textContent = '0'
  }

  // --- 9. Refresh Action ---
  btnRefreshTasks.addEventListener('click', async () => {
    if (currentWorkspaceId) {
      await Promise.all([
        loadTasks(currentWorkspaceId),
        loadRecentActivities(currentWorkspaceId),
      ])
      showToast('Refreshed')
    }
  })

  // --- 10. Helpers ---
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer)
    toastMessage.textContent = msg
    toast.classList.remove('hidden')
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden')
    }, 2500)
  }

  function formatRelativeTime(isoStr) {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return ''
      const diffMs = Date.now() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return `${Math.floor(diffHours / 24)}d ago`
    } catch {
      return ''
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
})
