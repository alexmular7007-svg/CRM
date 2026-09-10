import { extensionStorage } from '../storage/extensionStorage.js'

document.addEventListener('DOMContentLoaded', async () => {
  // Views & Containers
  const loginPanel = document.getElementById('login-panel')
  const authenticatedView = document.getElementById('authenticated-view')
  const sessionCheckingPanel = document.getElementById('session-checking-panel')
  const rememberedAccountPanel = document.getElementById('remembered-account-panel')
  const rememberedUserName = document.getElementById('remembered-user-name')
  const rememberedUserEmail = document.getElementById('remembered-user-email')
  const btnContinueUser = document.getElementById('btn-continue-user')
  const btnContinueName = document.getElementById('btn-continue-name')
  const btnSwitchAccount = document.getElementById('btn-switch-account')

  const formLogin = document.getElementById('form-login')
  const loginEmail = document.getElementById('login-email')
  const loginPassword = document.getElementById('login-password')
  const btnSubmitLogin = document.getElementById('btn-submit-login')
  const loginError = document.getElementById('login-error')
  const loginErrorText = document.getElementById('login-error-text')

  // Header & Controls
  const headerUserInfo = document.getElementById('header-user-info')
  const btnSignOut = document.getElementById('btn-sign-out')
  const workspaceSwitcher = document.getElementById('workspace-switcher')
  const btnOpenSettings = document.getElementById('btn-open-settings')
  const btnOpenOptions = document.getElementById('btn-open-options')

  // Real Task UI Elements
  const activeWorkspaceBadge = document.getElementById('active-workspace-badge')
  const taskCountBadge = document.getElementById('task-count-badge')
  const taskItemsContainer = document.getElementById('task-items')
  const taskListContainer = document.getElementById('task-list-container')
  const stateLoading = document.getElementById('state-loading')
  const stateError = document.getElementById('state-error')
  const stateEmpty = document.getElementById('state-empty')
  const errorMessageEl = document.getElementById('error-message')

  // Recent Activity Elements
  const recentActivitySection = document.getElementById('recent-activity-section')
  const activityLoading = document.getElementById('activity-loading')
  const activityEmpty = document.getElementById('activity-empty')
  const activityItemsContainer = document.getElementById('activity-items')
  const activityCountBadge = document.getElementById('activity-count-badge')

  // Action Buttons
  const btnRefreshTasks = document.getElementById('btn-refresh-tasks')
  const btnRetryTasks = document.getElementById('btn-retry-tasks')
  const btnShowCreateForm = document.getElementById('btn-show-create-form')
  const btnCloseCreateForm = document.getElementById('btn-close-create-form')
  const btnCancelCreateTask = document.getElementById('btn-cancel-create-task')
  const btnCreateFirstTask = document.getElementById('btn-create-first-task')

  // Form Elements
  const createTaskPanel = document.getElementById('create-task-panel')
  const formCreateTask = document.getElementById('form-create-task')
  const newTaskTitle = document.getElementById('new-task-title')
  const newTaskDesc = document.getElementById('new-task-desc')
  const newTaskAssignee = document.getElementById('new-task-assignee')
  const newTaskPriority = document.getElementById('new-task-priority')
  const newTaskDueDate = document.getElementById('new-task-duedate')
  const btnSubmitCreateTask = document.getElementById('btn-submit-create-task')
  const createTaskError = document.getElementById('create-task-error')
  const createTaskErrorText = document.getElementById('create-task-error-text')
  const successToast = document.getElementById('success-toast')
  const successToastText = document.getElementById('success-toast-text')

  // Legacy Harness Elements (for test harness validation)
  const extVersionEl = document.getElementById('ext-version')
  const extStatusBadge = document.getElementById('ext-status-badge')
  const crmConnBadge = document.getElementById('crm-conn-badge')
  const targetEndpointEl = document.getElementById('target-endpoint')
  const targetWorkspaceEl = document.getElementById('target-workspace')

  let cachedMembers = []
  let toastTimer = null

  // 1. Initialize Active Workspace & Settings
  const settings = await extensionStorage.get()
  const workspaceId = settings.workspaceId
  if (activeWorkspaceBadge) {
    activeWorkspaceBadge.textContent = workspaceId ? `#${workspaceId}` : '—'
  }
  if (targetWorkspaceEl) {
    targetWorkspaceEl.textContent = workspaceId ? `#${workspaceId}` : 'None'
  }
  if (targetEndpointEl) {
    targetEndpointEl.textContent = (settings.crmEndpoint || 'http://localhost:8080').replace(/^https?:\/\//, '')
  }
  if (extVersionEl && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    extVersionEl.textContent = 'v' + chrome.runtime.getManifest().version
  }

  // 2. Form Login Submission
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault()
      hideLoginError()

      const email = (loginEmail?.value || '').trim()
      const password = loginPassword?.value || ''

      if (!email || !password) {
        showLoginError('Email and password are required.')
        return
      }

      setLoginLoading(true)

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'LOGIN',
          email,
          password,
        })

        if (response && response.success && response.data) {
          formLogin.reset()
          const { user, workspaces, selectedWorkspaceId } = response.data
          // Remember email for fast sign-in without persisting credentials
          if (user?.email) {
            await extensionStorage.save({ lastUserEmail: user.email })
          }
          validSessionData = {
            user,
            workspaces: workspaces || [],
            workspaceId: selectedWorkspaceId,
          }
          showAuthenticatedView(user, workspaces, selectedWorkspaceId)
        } else {
          showLoginError(response?.error || 'Login failed. Please check your credentials.')
        }
      } catch (err) {
        showLoginError(err.message || 'Error communicating with background worker.')
      } finally {
        setLoginLoading(false)
      }
    })
  }

  let validSessionData = null

  // 3. Sign Out & Switch Account Handlers
  async function performAccountLogout() {
    try {
      await chrome.runtime.sendMessage({ type: 'LOGOUT' })
    } catch {}
    validSessionData = null
    cachedMembers = []
    if (taskItemsContainer) taskItemsContainer.innerHTML = ''
    if (activityItemsContainer) activityItemsContainer.innerHTML = ''
    if (recentActivitySection) recentActivitySection.classList.add('hidden')
    showLoginView()
  }

  if (btnSignOut) {
    btnSignOut.addEventListener('click', performAccountLogout)
  }

  if (btnSwitchAccount) {
    btnSwitchAccount.addEventListener('click', performAccountLogout)
  }

  // 4. Continue as User Handler
  if (btnContinueUser) {
    btnContinueUser.addEventListener('click', () => {
      if (validSessionData) {
        showAuthenticatedView(
          validSessionData.user,
          validSessionData.workspaces,
          validSessionData.workspaceId
        )
      } else {
        initSession()
      }
    })
  }

  // 5. Workspace Switcher Handler
  if (workspaceSwitcher) {
    workspaceSwitcher.addEventListener('change', async (e) => {
      const selectedWsId = e.target.value ? parseInt(e.target.value, 10) : null
      
      // Immediately clear UI and show loading to prevent stale task/member/activity display
      cachedMembers = []
      if (taskItemsContainer) taskItemsContainer.innerHTML = ''
      if (activityItemsContainer) activityItemsContainer.innerHTML = ''
      if (activityEmpty) activityEmpty.classList.add('hidden')
      if (activityCountBadge) activityCountBadge.textContent = '0'
      if (newTaskAssignee) newTaskAssignee.innerHTML = '<option value="">Unassigned</option>'
      showLoading()

      await chrome.runtime.sendMessage({
        type: 'SWITCH_WORKSPACE',
        workspaceId: selectedWsId,
      })

      if (activeWorkspaceBadge) {
        activeWorkspaceBadge.textContent = selectedWsId ? `#${selectedWsId}` : '—'
      }
      if (targetWorkspaceEl) {
        targetWorkspaceEl.textContent = selectedWsId ? `#${selectedWsId}` : 'None'
      }

      if (selectedWsId) {
        const btnFirst = document.getElementById('btn-create-first-task')
        if (btnFirst) btnFirst.classList.remove('hidden')
        await Promise.all([loadTasks(), loadMembers(), loadRecentActivities()])
      } else {
        if (recentActivitySection) recentActivitySection.classList.add('hidden')
        showWorkspacePrompt()
      }
    })
  }

  // 6. Create Task Form Toggle Handlers
  function openCreateForm() {
    if (createTaskPanel) {
      createTaskPanel.classList.remove('hidden')
    }
    hideCreateError()
    if (newTaskTitle) {
      newTaskTitle.focus()
    }
  }

  function closeCreateForm() {
    if (createTaskPanel) {
      createTaskPanel.classList.add('hidden')
    }
    if (formCreateTask) {
      formCreateTask.reset()
    }
    hideCreateError()
  }

  if (btnShowCreateForm) {
    btnShowCreateForm.addEventListener('click', openCreateForm)
  }

  if (btnCloseCreateForm) {
    btnCloseCreateForm.addEventListener('click', closeCreateForm)
  }

  if (btnCancelCreateTask) {
    btnCancelCreateTask.addEventListener('click', closeCreateForm)
  }

  if (btnCreateFirstTask) {
    btnCreateFirstTask.addEventListener('click', openCreateForm)
  }

  if (formCreateTask) {
    formCreateTask.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleCreateTask()
    })
  }

  if (btnRefreshTasks) {
    btnRefreshTasks.addEventListener('click', () => {
      loadTasks()
      loadRecentActivities()
    })
  }

  if (btnRetryTasks) {
    btnRetryTasks.addEventListener('click', () => {
      loadTasks()
    })
  }

  function openOptions() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(chrome.runtime.getURL('src/options/options.html'))
    }
  }

  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', openOptions)
  }

  if (btnOpenOptions) {
    btnOpenOptions.addEventListener('click', openOptions)
  }

  function showSessionChecking() {
    if (sessionCheckingPanel) sessionCheckingPanel.classList.remove('hidden')
    if (rememberedAccountPanel) rememberedAccountPanel.classList.add('hidden')
    if (loginPanel) loginPanel.classList.add('hidden')
    if (authenticatedView) authenticatedView.classList.add('hidden')
    if (btnSignOut) btnSignOut.classList.add('hidden')
    if (headerUserInfo) headerUserInfo.textContent = 'Checking...'
  }

  function showRememberedAccountView(user) {
    if (sessionCheckingPanel) sessionCheckingPanel.classList.add('hidden')
    if (loginPanel) loginPanel.classList.add('hidden')
    if (authenticatedView) authenticatedView.classList.add('hidden')
    if (rememberedAccountPanel) rememberedAccountPanel.classList.remove('hidden')
    if (btnSignOut) btnSignOut.classList.remove('hidden')

    const displayName = user?.fullName || user?.name || user?.email || 'User'
    const email = user?.email || ''

    if (headerUserInfo) headerUserInfo.textContent = displayName
    if (rememberedUserName) rememberedUserName.textContent = displayName
    if (rememberedUserEmail) rememberedUserEmail.textContent = email
    if (btnContinueName) btnContinueName.textContent = displayName.split(' ')[0] || displayName

    if (crmConnBadge) {
      crmConnBadge.textContent = 'CONNECTED'
      crmConnBadge.className = 'status-pill connected'
    }
  }

  async function showLoginView(errorMsg = null) {
    if (sessionCheckingPanel) sessionCheckingPanel.classList.add('hidden')
    if (rememberedAccountPanel) rememberedAccountPanel.classList.add('hidden')
    if (loginPanel) loginPanel.classList.remove('hidden')
    if (authenticatedView) authenticatedView.classList.add('hidden')
    if (btnSignOut) btnSignOut.classList.add('hidden')
    if (headerUserInfo) headerUserInfo.textContent = 'Sign In'

    // Remembered account prefill: email only, password strictly empty
    try {
      const s = await extensionStorage.get()
      if (loginEmail && (!loginEmail.value || !loginEmail.value.trim())) {
        const rememberedEmail = s.lastUserEmail || s.authenticatedUser?.email || ''
        if (rememberedEmail) {
          loginEmail.value = rememberedEmail
        }
      }
    } catch {}

    if (loginPassword) {
      loginPassword.value = ''
    }

    if (errorMsg) {
      showLoginError(errorMsg)
    } else {
      hideLoginError()
    }

    if (crmConnBadge) {
      crmConnBadge.textContent = 'DISCONNECTED'
      crmConnBadge.className = 'status-pill disconnected'
    }
  }

  function showAuthenticatedView(user, workspaces = [], activeWsId = null) {
    if (sessionCheckingPanel) sessionCheckingPanel.classList.add('hidden')
    if (rememberedAccountPanel) rememberedAccountPanel.classList.add('hidden')
    if (loginPanel) loginPanel.classList.add('hidden')
    if (authenticatedView) authenticatedView.classList.remove('hidden')
    if (btnSignOut) btnSignOut.classList.remove('hidden')

    const displayName = user?.fullName || user?.email || 'User'
    if (headerUserInfo) {
      headerUserInfo.textContent = displayName
    }

    setupWorkspaceSwitcher(workspaces, activeWsId)

    cachedMembers = []
    if (activeWsId) {
      loadTasks()
      loadMembers()
      loadRecentActivities()
    } else {
      if (recentActivitySection) recentActivitySection.classList.add('hidden')
      showWorkspacePrompt()
    }
  }

  function setupWorkspaceSwitcher(workspaces, activeWsId) {
    if (!workspaceSwitcher) return
    workspaceSwitcher.innerHTML = ''

    if (!workspaces || workspaces.length === 0) {
      const opt = document.createElement('option')
      opt.value = ''
      opt.textContent = 'No workspaces found'
      workspaceSwitcher.appendChild(opt)
      workspaceSwitcher.disabled = true
      return
    }

    workspaceSwitcher.disabled = false

    if (workspaces.length > 1) {
      const placeholderOpt = document.createElement('option')
      placeholderOpt.value = ''
      placeholderOpt.textContent = 'Select workspace...'
      workspaceSwitcher.appendChild(placeholderOpt)
    }

    workspaces.forEach((ws) => {
      const opt = document.createElement('option')
      opt.value = ws.id
      opt.textContent = ws.name || `Workspace #${ws.id}`
      if (activeWsId && ws.id === parseInt(activeWsId, 10)) {
        opt.selected = true
      }
      workspaceSwitcher.appendChild(opt)
    })

    if (activeWsId) {
      workspaceSwitcher.value = activeWsId.toString()
    }
  }

  function showWorkspacePrompt() {
    hideAllStates()
    stateEmpty.classList.remove('hidden')
    const titleEl = stateEmpty.querySelector('.state-title')
    const subEl = stateEmpty.querySelector('.state-sub')
    if (titleEl) titleEl.textContent = 'Please select a workspace'
    if (subEl) subEl.textContent = 'Choose a workspace from the dropdown above to view tasks.'
    const btnFirst = document.getElementById('btn-create-first-task')
    if (btnFirst) btnFirst.classList.add('hidden')
    taskCountBadge.textContent = '-'
  }

  function setLoginLoading(isLoading) {
    if (!btnSubmitLogin) return
    btnSubmitLogin.disabled = isLoading
    btnSubmitLogin.textContent = isLoading ? 'Signing In...' : 'Sign In'
  }

  function showLoginError(msg) {
    if (loginError && loginErrorText) {
      loginErrorText.textContent = msg
      loginError.classList.remove('hidden')
    }
  }

  function hideLoginError() {
    if (loginError) {
      loginError.classList.add('hidden')
    }
  }

  // 6. Initialize Session & Token Validation on Startup
  await initSession()

  async function initSession() {
    const s = await extensionStorage.get()
    const token = s.authToken

    if (!token) {
      showLoginView()
      return
    }

    showSessionChecking()

    try {
      const valRes = await chrome.runtime.sendMessage({
        type: 'VALIDATE_SESSION',
        token,
      })

      if (valRes && valRes.valid && valRes.user) {
        validSessionData = {
          user: valRes.user,
          workspaces: valRes.workspaces || [],
          workspaceId: valRes.workspaceId,
        }
        showRememberedAccountView(valRes.user)
      } else {
        validSessionData = null
        showLoginView(valRes?.error || 'Session expired. Please sign in again.')
      }
    } catch (err) {
      validSessionData = null
      showLoginView('Unable to validate session. Please sign in.')
    }
  }

  /**
   * Fetch and populate workspace members in the assignee dropdown
   */
  async function loadMembers() {
    const currentSettings = await extensionStorage.get()
    const targetWs = currentSettings.workspaceId
    const token = currentSettings.authToken || ''

    if (!targetWs || !token) return
    if (cachedMembers.length > 0) {
      populateAssigneeDropdown(cachedMembers)
      return
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_MEMBERS',
        workspaceId: targetWs,
        token: token,
      })

      if (response && response.success) {
        cachedMembers = Array.isArray(response.data) ? response.data : []
        populateAssigneeDropdown(cachedMembers)
      }
    } catch (err) {
      console.warn('Failed to fetch workspace members:', err)
    }
  }

  /**
   * Populate assignee dropdown options
   */
  function populateAssigneeDropdown(members) {
    if (!newTaskAssignee) return
    const currentVal = newTaskAssignee.value
    newTaskAssignee.innerHTML = '<option value="">Unassigned</option>'

    members.forEach((m) => {
      const opt = document.createElement('option')
      opt.value = m.userId
      opt.dataset.name = m.userName || m.userEmail || `User #${m.userId}`
      opt.textContent = `${m.userName || m.userEmail || `User #${m.userId}`} (${m.role || 'MEMBER'})`
      newTaskAssignee.appendChild(opt)
    })

    if (currentVal) {
      newTaskAssignee.value = currentVal
    }
  }

  /**
   * Handle Task Creation Submission
   */
  async function handleCreateTask() {
    const title = (newTaskTitle?.value || '').trim()
    if (!title) {
      showCreateError('Title is required.')
      return
    }

    const currentSettings = await extensionStorage.get()
    const targetWs = currentSettings.workspaceId
    const token = currentSettings.authToken || ''

    if (!targetWs) {
      showCreateError('Please select a workspace before creating tasks.')
      return
    }

    const description = (newTaskDesc?.value || '').trim() || null
    const priority = newTaskPriority?.value || 'MEDIUM'
    const dueDate = newTaskDueDate?.value || null

    let assignedToId = null
    let assignedToName = null
    if (newTaskAssignee && newTaskAssignee.value) {
      assignedToId = parseInt(newTaskAssignee.value, 10)
      const selectedOpt = newTaskAssignee.options[newTaskAssignee.selectedIndex]
      assignedToName = selectedOpt ? selectedOpt.dataset.name : null
    }

    const taskPayload = {
      workspaceId: targetWs,
      title,
      description,
      status: 'TODO',
      priority,
      dueDate,
      assignedToId,
      assignedToName,
      projectId: null,
      projectName: null,
    }

    // Set Loading State for Submit Button
    setSubmitLoading(true)
    hideCreateError()

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_TASK',
        taskData: taskPayload,
        token,
      })

      if (response && response.success) {
        showSuccessToast('Task assigned successfully!')
        closeCreateForm()
        await Promise.all([loadTasks(), loadRecentActivities()])
      } else {
        const errorMsg = response?.error || 'Failed to assign task.'
        showCreateError(errorMsg)
      }
    } catch (err) {
      showCreateError(err.message || 'Error communicating with background worker.')
    } finally {
      setSubmitLoading(false)
    }
  }

  function setSubmitLoading(isLoading) {
    if (!btnSubmitCreateTask) return
    btnSubmitCreateTask.disabled = isLoading
    btnSubmitCreateTask.textContent = isLoading ? 'Assigning...' : 'Assign Task'
  }

  function showCreateError(msg) {
    if (createTaskError && createTaskErrorText) {
      createTaskErrorText.textContent = msg
      createTaskError.classList.remove('hidden')
    }
  }

  function hideCreateError() {
    if (createTaskError) {
      createTaskError.classList.add('hidden')
    }
  }

  function showSuccessToast(message) {
    if (!successToast) return
    if (successToastText) successToastText.textContent = message
    successToast.classList.remove('hidden')

    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      successToast.classList.add('hidden')
    }, 3000)
  }

  /**
   * Fetch and render real CRM tasks
   */
  async function loadTasks() {
    const currentSettings = await extensionStorage.get()
    const targetWs = currentSettings.workspaceId
    const token = currentSettings.authToken || ''

    if (!token) {
      showLoginView()
      return
    }

    if (!targetWs) {
      showWorkspacePrompt()
      return
    }

    showLoading()

    if (activeWorkspaceBadge) {
      activeWorkspaceBadge.textContent = `#${targetWs}`
    }
    if (targetWorkspaceEl) {
      targetWorkspaceEl.textContent = `#${targetWs}`
    }

    try {
      // Send background message to fetch real tasks
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_TASKS',
        workspaceId: targetWs,
        token: token,
      })

      if (response && response.success) {
        const tasks = Array.isArray(response.data) ? response.data : []
        if (crmConnBadge) {
          crmConnBadge.textContent = 'CONNECTED'
          crmConnBadge.className = 'status-pill connected'
        }
        if (tasks.length === 0) {
          showEmpty()
        } else {
          renderTaskList(tasks)
        }
      } else {
        if (response?.statusCode === 401) {
          showLoginView('Session expired. Please sign in again.')
          return
        }

        const errorText = formatErrorMessage(response?.error, currentSettings)
        if (crmConnBadge) {
          crmConnBadge.textContent = 'DISCONNECTED'
          crmConnBadge.className = 'status-pill disconnected'
        }
        showError(errorText)
      }
    } catch (err) {
      showError(err.message || 'Failed to communicate with extension background worker.')
    }
  }

  /**
   * Render tasks into the UI container
   */
  function renderTaskList(tasks) {
    hideAllStates()
    taskListContainer.classList.remove('hidden')
    taskCountBadge.textContent = tasks.length.toString()

    taskItemsContainer.innerHTML = ''

    tasks.forEach((task) => {
      const card = createTaskCardElement(task)
      taskItemsContainer.appendChild(card)
    })
  }

  /**
   * Create an individual Task Row element
   */
  function createTaskCardElement(task) {
    const row = document.createElement('li')
    row.className = 'task-row'
    row.dataset.taskId = task.id
    const isDone = task.status === 'DONE'
    if (isDone) {
      row.classList.add('task-done')
    }

    const titleText = task.title ? escapeHtml(task.title) : 'Untitled Task'
    const priority = (task.priority || 'MEDIUM').toUpperCase()
    const priorityClass = `priority-${priority.toLowerCase()}`

    const dueDateFormatted = formatDueDate(task.dueDate)
    const isOverdue = Boolean(task.overdue && task.status !== 'DONE')

    const assignedName = task.assignedTo?.fullName || task.assignedToName || 'Unassigned'
    const statusText = (task.status || 'TODO').toUpperCase()
    const statusClass = `status-${statusText.toLowerCase()}`

    // Status Action Toggle Button (Circle Checkbox)
    const statusBtn = document.createElement('button')
    statusBtn.type = 'button'
    statusBtn.className = `task-status-btn ${isDone ? 'completed' : ''}`
    statusBtn.title = isDone ? 'Mark task TODO' : 'Mark task DONE'
    statusBtn.setAttribute('aria-label', isDone ? 'Mark task incomplete' : 'Mark task complete')
    statusBtn.innerHTML = `
      <svg class="task-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `

    statusBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (statusBtn.disabled) return
      statusBtn.disabled = true
      row.classList.add('task-updating')

      const currentSettings = await extensionStorage.get()
      const targetWs = currentSettings.workspaceId
      const token = currentSettings.authToken || ''
      const isCurrentlyDone = task.status === 'DONE'
      const newStatus = isCurrentlyDone ? 'TODO' : 'DONE'

      try {
        const res = await chrome.runtime.sendMessage({
          type: 'UPDATE_TASK_STATUS',
          taskId: task.id,
          status: newStatus,
          workspaceId: targetWs,
          token: token,
        })

        if (res && res.success) {
          task.status = newStatus
          if (newStatus === 'DONE') {
            row.classList.add('task-done')
            statusBtn.classList.add('completed')
            statusBtn.title = 'Mark task TODO'
            showSuccessToast('Task marked complete!')
          } else {
            row.classList.remove('task-done')
            statusBtn.classList.remove('completed')
            statusBtn.title = 'Mark task DONE'
            showSuccessToast('Task reopened.')
          }
          const tag = row.querySelector('.status-tag')
          if (tag) {
            tag.className = `status-tag status-${newStatus.toLowerCase()}`
            tag.textContent = newStatus
          }
          loadRecentActivities()
        } else {
          showSuccessToast(res?.error || 'Failed to update task status')
        }
      } catch (err) {
        showSuccessToast(err.message || 'Error updating task status')
      } finally {
        statusBtn.disabled = false
        row.classList.remove('task-updating')
      }
    })

    const mainDiv = document.createElement('div')
    mainDiv.className = 'task-main'
    mainDiv.innerHTML = `
      <span class="task-title">${titleText}</span>
      <span class="task-meta">
        <span class="priority-badge ${priorityClass}">${priority}</span>
        <span class="due-date ${isOverdue ? 'overdue' : ''}">· ${dueDateFormatted}</span>
      </span>
      <span class="task-assignee">${escapeHtml(assignedName)}</span>
    `

    const sideDiv = document.createElement('div')
    sideDiv.className = 'task-side'
    sideDiv.innerHTML = `
      <span class="status-tag ${statusClass}">${statusText}</span>
    `

    row.appendChild(statusBtn)
    row.appendChild(mainDiv)
    row.appendChild(sideDiv)

    return row
  }

  /**
   * Format ISO / standard YYYY-MM-DD date to "Sep 15"
   */
  function formatDueDate(dueDateStr) {
    if (!dueDateStr) return 'No due date'
    try {
      const parts = dueDateStr.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const date = new Date(year, month, day)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${months[date.getMonth()]} ${date.getDate()}`
      }
      const d = new Date(dueDateStr)
      if (isNaN(d.getTime())) return dueDateStr
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[d.getMonth()]} ${d.getDate()}`
    } catch {
      return dueDateStr
    }
  }

  /**
   * Format helpful error messages based on response
   */
  function formatErrorMessage(errorMsg, currentSettings) {
    if (!errorMsg) return 'Unable to load tasks from CRM.'
    if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized')) {
      return 'Authentication required. Please sign in.'
    }
    if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('denied')) {
      return `Access denied. Your user account does not have access to Workspace #${currentSettings.workspaceId || ''}.`
    }
    if (errorMsg.toLowerCase().includes('failed to fetch') || errorMsg.toLowerCase().includes('network')) {
      return `Cannot reach CRM at ${currentSettings.crmEndpoint || 'http://localhost:8080'}. Ensure the backend is running.`
    }
    return errorMsg
  }

  function showLoading() {
    hideAllStates()
    stateLoading.classList.remove('hidden')
  }

  function showEmpty() {
    hideAllStates()
    stateEmpty.classList.remove('hidden')
    taskCountBadge.textContent = '0'
  }

  function showError(msg) {
    hideAllStates()
    stateError.classList.remove('hidden')
    errorMessageEl.textContent = msg
    taskCountBadge.textContent = '!'
  }

  function hideAllStates() {
    stateLoading.classList.add('hidden')
    stateError.classList.add('hidden')
    stateEmpty.classList.add('hidden')
    taskListContainer.classList.add('hidden')
  }

  /**
   * Fetch and render recent workspace activities
   */
  async function loadRecentActivities() {
    const currentSettings = await extensionStorage.get()
    const targetWs = currentSettings.workspaceId
    const token = currentSettings.authToken || ''

    if (!token || !targetWs) {
      if (recentActivitySection) recentActivitySection.classList.add('hidden')
      return
    }

    if (recentActivitySection) recentActivitySection.classList.remove('hidden')
    if (activityLoading) activityLoading.classList.remove('hidden')
    if (activityEmpty) activityEmpty.classList.add('hidden')
    if (activityItemsContainer) {
      activityItemsContainer.classList.add('hidden')
      activityItemsContainer.innerHTML = ''
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_RECENT_ACTIVITIES',
        workspaceId: targetWs,
        token: token,
        limit: 8,
      })

      if (activityLoading) activityLoading.classList.add('hidden')

      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        renderActivities(response.data)
      } else {
        showEmptyActivities()
      }
    } catch (err) {
      if (activityLoading) activityLoading.classList.add('hidden')
      showEmptyActivities()
    }
  }

  function showEmptyActivities() {
    if (activityEmpty) activityEmpty.classList.remove('hidden')
    if (activityItemsContainer) activityItemsContainer.classList.add('hidden')
    if (activityCountBadge) activityCountBadge.textContent = '0'
  }

  function renderActivities(activities) {
    if (!activityItemsContainer) return
    activityItemsContainer.innerHTML = ''
    activityItemsContainer.classList.remove('hidden')
    if (activityEmpty) activityEmpty.classList.add('hidden')
    if (activityCountBadge) activityCountBadge.textContent = activities.length.toString()

    activities.forEach((act) => {
      const row = createActivityItemElement(act)
      activityItemsContainer.appendChild(row)
    })
  }

  function createActivityItemElement(act) {
    const li = document.createElement('li')
    li.className = 'activity-item'

    const actType = (act.type || 'TASK').toUpperCase()
    const desc = (act.description || '').toUpperCase()
    const isDone = desc.includes('DONE') || desc.includes('COMPLETE')
    const isCreate = desc.includes('CREATE')
    const isLead = actType === 'LEAD'

    let iconBoxClass = 'icon-update'
    let svgPath = '<path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'

    if (isDone) {
      iconBoxClass = 'icon-done'
      svgPath = '<path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
    } else if (isCreate) {
      iconBoxClass = 'icon-create'
      svgPath = '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
    } else if (isLead) {
      iconBoxClass = 'icon-lead'
      svgPath = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    }

    const titleSafe = escapeHtml(act.title || 'Activity')
    const descSafe = escapeHtml(act.description || '')
    const authorSafe = escapeHtml(act.createdBy || 'User')
    const timeSafe = formatRelativeTime(act.timestamp)

    li.innerHTML = `
      <div class="activity-item-icon-box ${iconBoxClass}">
        <svg class="activity-item-svg" viewBox="0 0 24 24">
          ${svgPath}
        </svg>
      </div>
      <div class="activity-item-content">
        <div class="activity-item-title-row">
          <span class="activity-item-title" title="${titleSafe}">${titleSafe}</span>
        </div>
        <span class="activity-item-desc" title="${descSafe}">${descSafe}</span>
        <div class="activity-item-meta">
          <span class="activity-item-author">${authorSafe}</span>
          <span class="activity-item-time">${timeSafe}</span>
        </div>
      </div>
    `
    return li
  }

  function formatRelativeTime(isoStr) {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return ''
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 7) return `${diffDays}d ago`
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[d.getMonth()]} ${d.getDate()}`
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
