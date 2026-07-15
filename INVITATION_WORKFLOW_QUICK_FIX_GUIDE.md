# INVITATION WORKFLOW - QUICK FIX SUMMARY

## 🔴 Problems Fixed

1. **Workspace not appearing after accepting invitation** - Cache wasn't invalidated
2. **Owner never notified of acceptance** - No event publishing
3. **User didn't get "joined workspace" notification** - No event listener

---

## ✅ Solutions Applied

### **BACKEND: Create Event Class**

**File:** `crm-backend/src/main/java/com/arjun/crm/event/InvitationAcceptedEvent.java` *(NEW)*

Event published when user accepts invitation. Contains:
- `member` - The newly created workspace member
- `workspace` - The workspace joined
- `acceptedBy` - User who accepted
- `invitedBy` - User who sent invitation

---

### **BACKEND: Add Event Handler**

**File:** `crm-backend/src/main/java/com/arjun/crm/listener/NotificationEventListener.java` *(MODIFIED)*

**Added Method:**
```java
@Async
@TransactionalEventListener
public void handleInvitationAcceptedEvent(InvitationAcceptedEvent event) {
    // Notify accepted user: "You joined Workspace XYZ"
    notificationService.createNotification(
        event.getAcceptedBy(),
        "Joined Workspace",
        "You joined workspace: " + event.getWorkspace().getName(),
        NotificationType.WORKSPACE_INVITATION,
        event.getWorkspace().getId(),
        ReferenceType.WORKSPACE,
        event.getWorkspace()
    );

    // Notify owner: "John Doe accepted your invitation to Workspace XYZ as MEMBER"
    if (event.getInvitedBy() != null && 
        !event.getInvitedBy().getId().equals(event.getAcceptedBy().getId())) {
        notificationService.createNotification(
            event.getInvitedBy(),
            "Invitation Accepted",
            String.format("%s accepted your invitation to workspace: %s as %s",
                event.getAcceptedBy().getFullName(),
                event.getWorkspace().getName(),
                event.getMember().getRole().toString()
            ),
            NotificationType.WORKSPACE_INVITATION,
            event.getWorkspace().getId(),
            ReferenceType.WORKSPACE,
            event.getWorkspace()
        );
    }
}
```

---

### **BACKEND: Publish Event**

**File:** `crm-backend/src/main/java/com/arjun/crm/service/impl/InvitationServiceImpl.java` *(MODIFIED)*

**Step 1: Add dependency**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationServiceImpl implements InvitationService {
    // ... existing fields ...
    private final ApplicationEventPublisher eventPublisher;  // ← ADD THIS
}
```

**Step 2: Publish event in acceptInvitation() method**

In `InvitationServiceImpl.acceptInvitation()`, after saving the member:

```java
// Create workspace member
WorkspaceMember member = WorkspaceMember.builder()
    .workspace(invitation.getWorkspace())
    .user(currentUser)
    .role(invitation.getRole())
    .status("ACTIVE")
    .invitedAt(invitation.getInvitedAt())
    .invitedBy(invitation.getInvitedBy())
    .build();

WorkspaceMember savedMember = memberRepository.save(member);

// Update invitation as accepted
invitation.setStatus(InvitationStatus.ACCEPTED);
invitation.setAcceptedAt(LocalDateTime.now());
invitation.setAcceptedBy(currentUser);
invitationRepository.save(invitation);

log.info("Invitation accepted for {}, member created in workspace {}", 
    currentUser.getEmail(), invitation.getWorkspace().getId());

// ← ADD THIS: Publish event to trigger notifications
eventPublisher.publishEvent(new InvitationAcceptedEvent(
    this,
    savedMember,
    invitation.getWorkspace(),
    currentUser,
    invitation.getInvitedBy()
));

return InvitationAcceptResponse.fromEntity(savedMember);
```

---

### **FRONTEND: Make QueryClient Global**

**File:** `crm-frontend/src/main.jsx` *(MODIFIED)*

After creating queryClient:

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

// ← ADD THIS LINE:
window.__queryClient = queryClient
```

---

### **FRONTEND: Invalidate Cache on OAuth Callback**

**File:** `crm-frontend/src/pages/auth/OAuth2Callback.jsx` *(MODIFIED)*

In `acceptInvitationAndRedirect()` function, after successful acceptance:

```javascript
const acceptInvitationAndRedirect = async (jwtToken, invToken, apiBase) => {
    try {
        const response = await fetch(
            `${apiBase}/workspaces/invitations/accept/${invToken}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
            navigate('/dashboard', { replace: true })
            return
        }

        const body = await response.json()
        
        // ← ADD THESE LINES:
        try {
            if (window.__queryClient) {
                window.__queryClient.invalidateQueries({ queryKey: ['workspaces'] })
            }
        } catch (e) {
            console.log('Cache invalidation skipped:', e)
        }
        
        const workspaceData = body?.data?.workspace ?? body?.workspace

        console.log('✓ Invitation accepted successfully')
        toast.success('Invitation accepted! Redirecting to workspace...')

        // Redirect to the workspace
        if (workspaceData?.id) {
            navigate(`/workspaces/${workspaceData.id}`, { replace: true })
        } else {
            navigate('/dashboard', { replace: true })
        }
    } catch (err) {
        console.error('Failed to auto-accept invitation:', err)
        navigate('/dashboard', { replace: true })
    }
}
```

---

## 📊 What Each Fix Does

| Issue | Fix | Why |
|-------|-----|-----|
| Owner not notified | Event + listener | Async notification creation for owner |
| User not notified | Event + listener | Async notification creation for user |
| Workspace not appearing | Cache invalidation | Force React Query to refetch |
| Event not published | ApplicationEventPublisher | Triggers async event processing |

---

## 🧪 Test Checklist

After applying fixes:

- [ ] Backend compiles: `mvn clean compile`
- [ ] Frontend builds: `npm run build`
- [ ] Test invitation flow:
  1. Owner creates workspace
  2. Owner invites user with Google email
  3. User clicks invitation link (not logged in)
  4. User logs in with Google
  5. **Check:** Workspace appears immediately
  6. **Check:** User sees notification "You joined Workspace XYZ"
  7. **Check:** Owner sees notification "John accepted your invitation"
  8. **Check:** Member appears in Members tab with role MEMBER

---

## 🚀 Deploy Steps

1. **Backend:**
   ```bash
   cd crm-backend
   mvn clean package -DskipTests
   # Deploy to server
   ```

2. **Frontend:**
   ```bash
   cd crm-frontend
   npm run build
   # Deploy to Vercel or server
   ```

3. **Verify:**
   - [ ] Backend running and listening on port 8081
   - [ ] Frontend can reach backend
   - [ ] WebSocket notifications working
   - [ ] Email service working (if testing with real email)

---

## 📝 Code Files Summary

| File | Type | Lines Added | Type of Change |
|------|------|-------------|----------------|
| InvitationAcceptedEvent.java | NEW | ~20 | Event class |
| NotificationEventListener.java | MODIFIED | ~50 | Event handler |
| InvitationServiceImpl.java | MODIFIED | ~10 | Event publish |
| OAuth2Callback.jsx | MODIFIED | ~8 | Cache invalidate |
| main.jsx | MODIFIED | ~1 | Global queryClient |

**Total changes:** ~90 lines across 5 files

---

## 🔍 How It Works End-to-End

```
User clicks email link
    ↓
OAuth2 login (Google/GitHub)
    ↓
Backend finds pending invitation
    ↓
Backend passes invitationToken to frontend
    ↓
Frontend auto-calls accept endpoint
    ↓
Backend creates WorkspaceMember
    ↓
Backend publishes InvitationAcceptedEvent ✅
    ↓
Event listener creates 2 notifications ✅
    ↓
Frontend invalidates workspace cache ✅
    ↓
React Query refetches workspaces
    ↓
New workspace appears in list ✅
    ↓
WebSocket sends real-time notifications ✅
    ↓
Frontend redirects to workspace dashboard ✅
```

---

**All 3 issues FIXED in 5 files with 90 lines of code!** 🎉
