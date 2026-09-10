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
    taskItemsContainer.innerHTML = ''
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
      
      // Immediately clear UI and show loading to prevent stale task/member display
      cachedMembers = []
      if (taskItemsContainer) taskItemsContainer.innerHTML = ''
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
        await Promise.all([loadTasks(), loadMembers()])
      } else {
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
    })
  }

  if (btnRetryTasks) {
    btnRetryTasks.addEventListener('click', () => {
      loadTasks()
    })
  }

  if (btnOpenOptions) {
    btnOpenOptions.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage()
      } else {
        window.open(chrome.runtime.getURL('src/options/options.html'))
      }
    })
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

  function showLoginView(errorMsg = null) {
    if (sessionCheckingPanel) sessionCheckingPanel.classList.add('hidden')
    if (rememberedAccountPanel) rememberedAccountPanel.classList.add('hidden')
    if (loginPanel) loginPanel.classList.remove('hidden')
    if (authenticatedView) authenticatedView.classList.add('hidden')
    if (btnSignOut) btnSignOut.classList.add('hidden')
    if (headerUserInfo) headerUserInfo.textContent = 'Sign In'

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
    } else {
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
        showSuccessToast('Task created successfully!')
        closeCreateForm()
        await loadTasks()
      } else {
        const errorMsg = response?.error || 'Failed to create task.'
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
    btnSubmitCreateTask.textContent = isLoading ? 'Creating...' : 'Create Task'
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
      const newStatus = isDone ? 'TODO' : 'DONE'

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
})
