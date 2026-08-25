# FEATURE #2 — PHASE 1B SCOPE DEFINITION

## APPROVED PHASE 1B DELIVERABLES

### Authenticated Campaign Management (Admin/Owner Operations)

**Controllers to Create:**
- `LeadMagnetController` (authenticated endpoints only)

**Endpoints (5 core operations):**
1. `POST /api/admin/lead-magnets` - Create new magnet
2. `GET /api/admin/lead-magnets?workspaceId={id}` - List workspace magnets (paginated)
3. `GET /api/admin/lead-magnets/{id}` - Get magnet details
4. `PUT /api/admin/lead-magnets/{id}` - Edit magnet (name, description, slug)
5. `PATCH /api/admin/lead-magnets/{id}/status` - Toggle isActive (activate/deactivate)

**Response Contract:**
All responses include:
- `id` (internal magnet ID)
- `publicToken` (for frontend route construction)
- `slug` (for frontend route construction)
- `name`, `description`, `isActive`
- `createdAt`, `updatedAt`

**Frontend Route Construction:**
Frontend will use: `/m/{publicToken}/{slug}` (MUST construct this, not returned by API)

**Services to Create (Minimal):**
- `LeadMagnetService` (CRUD operations only)
  - createMagnet()
  - updateMagnet()
  - toggleMagnetStatus()
  - getMagnetById()
  - listMagnetsByWorkspace()

**Repository Methods Used:**
- `LeadMagnetRepository` (existing, no additions)
  - findByIdAndWorkspaceId()
  - existsByWorkspaceIdAndSlug()
  - findByWorkspaceId()
  - save(), delete()

---

## EXPLICITLY NOT IMPLEMENTING IN PHASE 1B

### Public Visitor Functionality
- ❌ Public form submission endpoint
- ❌ POST /api/public/lead-magnets/{publicToken}/{slug}/submit
- ❌ Visitor view tracking
- ❌ Session token generation
- ❌ Referrer tracking

### Analytics & Reporting
- ❌ Submissions dashboard
- ❌ Views dashboard
- ❌ Conversion rate analytics
- ❌ Referrer breakdown
- ❌ Date range analytics endpoints

### Infrastructure
- ❌ Redis rate limiting
- ❌ Session token validation
- ❌ IP hashing (Phase 1C)
- ❌ Duplicate detection logic

### Notifications & Events
- ❌ New submission notifications
- ❌ Analytics alerts
- ❌ WebSocket changes
- ❌ Event publishing

### Feature #1 Modifications
- ❌ Lead conversion from magnet submissions
- ❌ Submission → Lead linking
- ❌ Lead magnet attribution in Lead entity
- ❌ Feature #1 workflow changes

### Frontend
- ❌ Campaign management UI
- ❌ Campaign list/detail pages
- ❌ Campaign edit forms
- ❌ Public magnet landing page
- ❌ Public form submission form

---

## PHASE 1B ARCHITECTURE

### Authentication/Authorization
- Admin/Owner: Full CRUD
- Editor: Read + Update (if designed later)
- Member: Read-only (if designed later)
- Public: No access (public endpoints come in Phase 1C)

### Data Validation
- Name: Required, 1-255 chars
- Slug: Required, lowercase alphanumeric + hyphens, unique per workspace
- Description: Optional, up to 2000 chars
- publicToken: Auto-generated UUID (immutable)

### Error Handling
- 400: Validation errors (duplicate slug, invalid input)
- 401: Unauthenticated
- 403: Access denied (not admin/owner of workspace)
- 404: Magnet not found
- 409: Conflict (slug already in use)

---

## DEPENDENCY ASSUMPTIONS

**No New Dependencies Required:**
- Spring Web: Already available
- Spring Data JPA: Already available
- Spring Security: Already available
- Lombok: Already available

**No External Services:**
- No Redis (Phase 1C)
- No Email/Notifications (Phase 2)
- No Analytics databases (Phase 1C)

---

## STOP CONDITION FOR PHASE 1B

**Do NOT proceed to Phase 1C or other phases until Phase 1B is complete.**

Phase 1B is complete when:
1. ✓ All 5 endpoints implemented
2. ✓ Access control validated (admin/owner checks)
3. ✓ LeadMagnet entity relationships working (workspace, createdBy)
4. ✓ publicToken returned in responses (frontend uses for route)
5. ✓ Slug uniqueness per workspace enforced
6. ✓ Manual testing verified CRUD operations
7. ✓ No new dependencies added
8. ✓ Feature #1 remains untouched
9. ✓ No Redis, notifications, or public endpoints

---

## NEXT: PHASE 1C (After 1B Approved)

Phase 1C will implement:
- Public form submission API
- Session token generation + hashing
- View tracking (Redis dedup + DB persistence)
- Rate limiting (IP hashing with HMAC-SHA256)
- Submissions → Lead linking
- Referrer attribution

---

**PHASE 1B IS CAMPAIGN MANAGEMENT FOR ADMINS ONLY. NO PUBLIC FEATURES YET.**
