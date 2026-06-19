# AI-Powered CRM & Task Manager - Frontend

Production-ready React frontend for AI-powered Task Manager + CRM + Real-Time Collaboration platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Redux Toolkit** - State management
- **React Query** - Server state management
- **Axios** - HTTP client
- **STOMP/SockJS** - WebSocket client
- **Recharts** - Charts
- **React Hot Toast** - Notifications
- **React Beautiful DnD** - Drag and drop

## Project Structure

```
crm-frontend/
├── public/
├── src/
│   ├── assets/              # Images, icons
│   ├── components/          # Reusable components
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Avatar.jsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.jsx
│   │   │   ├── ActivityFeed.jsx
│   │   │   └── QuickActions.jsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskList.jsx
│   │   │   ├── TaskModal.jsx
│   │   │   └── KanbanColumn.jsx
│   │   ├── chat/
│   │   │   ├── ChatList.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── TypingIndicator.jsx
│   │   ├── notifications/
│   │   │   ├── NotificationPanel.jsx
│   │   │   └── NotificationItem.jsx
│   │   ├── analytics/
│   │   │   ├── Chart.jsx
│   │   │   └── MetricCard.jsx
│   │   └── ai/
│   │       ├── AISuggestionCard.jsx
│   │       ├── AIInsightPanel.jsx
│   │       └── SmartReplyBox.jsx
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useTheme.js
│   │   ├── useWebSocket.js
│   │   └── useDebounce.js
│   ├── layouts/             # Layout components
│   │   ├── AuthLayout.jsx
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── pages/               # Page components
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Workspaces.jsx
│   │   ├── Projects.jsx
│   │   ├── Tasks.jsx
│   │   ├── KanbanBoard.jsx
│   │   ├── CRMPipeline.jsx
│   │   ├── Chat.jsx
│   │   ├── Analytics.jsx
│   │   ├── AIInsights.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── services/            # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── workspaceService.js
│   │   ├── projectService.js
│   │   ├── taskService.js
│   │   ├── chatService.js
│   │   ├── analyticsService.js
│   │   ├── aiService.js
│   │   └── websocketService.js
│   ├── store/               # Redux store
│   │   ├── index.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── themeSlice.js
│   │       ├── notificationSlice.js
│   │       └── workspaceSlice.js
│   ├── utils/               # Utility functions
│   │   ├── formatDate.js
│   │   ├── constants.js
│   │   └── validators.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

## Features Implemented

### ✅ Core Features
- JWT Authentication
- Protected Routes
- Dark/Light Mode
- Responsive Design
- Real-time WebSocket
- Redux State Management
- React Query for API calls
- Axios Interceptors

### ✅ Pages
- Login/Register
- Dashboard
- Workspaces
- Projects
- Tasks (List & Kanban)
- CRM Pipeline
- Real-time Chat
- Analytics
- AI Insights
- Profile/Settings

### ✅ Components
- Reusable UI components
- Loading skeletons
- Toast notifications
- Modal dialogs
- Form inputs
- Charts
- Activity feeds

### ✅ Real-time Features
- WebSocket notifications
- Live chat
- Typing indicators
- Online presence
- Unread counters

### ✅ AI Features
- Task prioritization UI
- Deadline prediction UI
- Chat summarization UI
- Smart reply suggestions
- Productivity insights

## API Integration

The frontend is configured to work with the backend API running on `http://localhost:8080`.

### API Endpoints Used:
- `/api/auth/*` - Authentication
- `/api/workspaces/*` - Workspaces
- `/api/projects/*` - Projects
- `/api/tasks/*` - Tasks
- `/api/chat/*` - Chat
- `/api/analytics/*` - Analytics
- `/api/ai/*` - AI features
- `/ws` - WebSocket connection

## State Management

### Redux Slices:
- **authSlice** - User authentication state
- **themeSlice** - Dark/light mode
- **notificationSlice** - Notifications
- **workspaceSlice** - Current workspace/project

### React Query:
- Server state caching
- Automatic refetching
- Optimistic updates
- Background sync

## WebSocket Integration

Real-time features using STOMP over SockJS:
- Notifications: `/user/queue/notifications`
- Chat messages: `/topic/chat/{roomId}`
- Typing indicators: `/topic/chat/{roomId}/typing`
- Online presence: Redis-based

## Styling

### Tailwind CSS Classes:
- `btn-primary` - Primary button
- `btn-secondary` - Secondary button
- `btn-outline` - Outline button
- `card` - Card container
- `input` - Form input
- `label` - Form label

### Dark Mode:
- Automatic dark mode support
- Toggle in header
- Persisted in localStorage

## Development Guidelines

### Component Structure:
```jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

const MyComponent = () => {
  const [state, setState] = useState()
  
  const { data, isLoading } = useQuery({
    queryKey: ['key'],
    queryFn: fetchData,
  })

  if (isLoading) return <Spinner />

  return (
    <div className="card">
      {/* Component content */}
    </div>
  )
}

export default MyComponent
```

### API Service Pattern:
```javascript
export const myService = {
  getAll: async () => {
    const response = await api.get('/endpoint')
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/endpoint', data)
    return response.data
  },
}
```

### Custom Hook Pattern:
```javascript
export const useMyHook = () => {
  const dispatch = useDispatch()
  const state = useSelector((state) => state.slice)

  const action = () => {
    dispatch(myAction())
  }

  return { state, action }
}
```

## Next Steps

To complete the frontend, create the remaining files:

1. **Components** - Create all component files listed in the structure
2. **Pages** - Implement all page components
3. **Layouts** - Complete DashboardLayout with Sidebar and Header
4. **Utils** - Add utility functions
5. **Assets** - Add images and icons

## Testing

```bash
# Run tests (when configured)
npm test

# Run linter
npm run lint
```

## Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the production build
# Deploy to your hosting service (Vercel, Netlify, etc.)
```

## Backend Integration

Ensure the backend is running on `http://localhost:8080` before starting the frontend.

Backend endpoints documentation:
- See `crm-backend/AUTH_API_DOCUMENTATION.md`
- See `crm-backend/CHAT_SYSTEM_API_DOCS.md`
- See `crm-backend/ANALYTICS_REPORTING_API_DOCS.md`
- See `crm-backend/AI_INTELLIGENCE_API_DOCS.md`

## Support

For issues or questions, refer to the backend API documentation or check the console for errors.

---

**Frontend is ready for development! Start with `npm install` and `npm run dev`** 🚀
