# Email Campaign Analytics - Complete Location Map

## Overview

Email Analytics is implemented across **Backend**, **Frontend**, and **Database** with webhook integration from Brevo email service.

---

## 📍 BACKEND ANALYTICS LOCATION

### 1. **Controllers** (REST API Endpoints)

#### `crm-backend/src/main/java/com/arjun/crm/controller/EmailCampaignController.java`
- **Endpoint**: `GET /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/analytics`
- **Purpose**: Returns campaign metrics (sentCount, deliveredCount, openedCount, clickedCount)
- **Status**: ✅ Implemented
- **Lines**: Returns `EmailCampaignResponse` with metrics fields

#### `crm-backend/src/main/java/com/arjun/crm/controller/BrevoWebhookController.java`
- **Endpoint**: `POST /api/webhooks/brevo` (No auth required)
- **Purpose**: Receives webhook events from Brevo (DELIVERED, OPENED, CLICKED, BOUNCED, etc.)
- **Status**: ✅ Implemented
- **Features**:
  - Accepts `BrevoWebhookRequest` payload
  - Delegates to `EmailAnalyticsService` for processing
  - Returns 200 OK for all events (prevents retry loops)
  - Comprehensive error handling and logging

---

### 2. **Services** (Business Logic)

#### `crm-backend/src/main/java/com/arjun/crm/service/EmailAnalyticsService.java` (Interface)
- **Methods**:
  - `processWebhookEvent(BrevoWebhookRequest)` - Process incoming webhook events
  - `getCampaignAnalytics(Long campaignId)` - Get campaign analytics summary
  - `getRecipientMetrics(Long campaignId)` - Get recipient-level metrics

#### `crm-backend/src/main/java/com/arjun/crm/service/impl/EmailAnalyticsServiceImpl.java` (Implementation)
- **Status**: ✅ Fully implemented
- **Key Methods**:
  1. `processWebhookEvent()` - Main webhook processing logic
     - Validates webhook payload
     - Updates recipient status and timestamps
     - Aggregates campaign metrics
     - Prevents duplicate events using `providerEventId`
  
  2. `updateRecipientStatus()` - Updates recipient with event data
     - DELIVERED → sets `deliveredAt`
     - OPENED → sets `openedAt`
     - CLICKED → increments `clickCount`
     - BOUNCED → sets `bounceType`
     - UNSUBSCRIBED → sets `unsubscribedAt`
  
  3. `aggregateCampaignMetrics()` - Calculates campaign-level metrics
     - Counts recipients by status
     - Updates campaign counters
  
  4. `recordAnalyticsHistory()` - Audit trail
     - Creates `EmailCampaignHistory` record
     - Tracks all events for debugging

**File Location**: `crm-backend/src/main/java/com/arjun/crm/service/impl/EmailAnalyticsServiceImpl.java`

---

### 3. **DTOs** (Data Transfer Objects)

#### `crm-backend/src/main/java/com/arjun/crm/dto/request/BrevoWebhookRequest.java`
- **Purpose**: Request payload from Brevo webhooks
- **Fields**:
  - `event` - Event type (DELIVERED, OPENED, CLICKED, etc.)
  - `email` - Recipient email address
  - `campaignId` - Campaign identifier
  - `recipientId` - Recipient identifier
  - `messageId` - Brevo message ID
  - `timestamp` - Event timestamp
  - `metadata` - Additional event data

#### `crm-backend/src/main/java/com/arjun/crm/dto/response/EmailCampaignResponse.java`
- **Purpose**: Campaign details with analytics metrics
- **Analytics Fields**:
  - `sentCount` - Total emails sent
  - `deliveredCount` - Emails delivered
  - `openedCount` - Emails opened
  - `clickedCount` - Emails with clicks
  - `bouncedCount` - Emails bounced
  - `failedCount` - Emails failed to send

#### `crm-backend/src/main/java/com/arjun/crm/service/EmailCampaignAnalyticsResponse.java`
- **Purpose**: Detailed analytics response
- **Contains**: Campaign ID, metrics, timeline data

---

### 4. **Entities** (Database Models)

#### `crm-backend/src/main/java/com/arjun/crm/entity/EmailCampaign.java`
- **Analytics Fields**:
  ```java
  private Integer sentCount;
  private Integer deliveredCount;
  private Integer openedCount;
  private Integer clickedCount;
  private Integer bouncedCount;
  private Integer failedCount;
  ```
- **Relations**:
  - `@OneToMany` → `EmailCampaignHistory` (audit trail)
  - `@OneToMany` → `EmailCampaignAnalyticsSnapshot` (pre-computed metrics)

#### `crm-backend/src/main/java/com/arjun/crm/entity/EmailCampaignRecipient.java`
- **Status Tracking Fields**:
  ```java
  private String status;  // PENDING, SENT, DELIVERED, OPENED, CLICKED, BOUNCED
  private LocalDateTime sentAt;
  private LocalDateTime deliveredAt;
  private LocalDateTime openedAt;
  private LocalDateTime firstClickedAt;
  private LocalDateTime lastClickedAt;
  private Integer clickCount;
  private LocalDateTime unsubscribedAt;
  private String bounceType;  // HARD_BOUNCE, SOFT_BOUNCE
  ```

#### `crm-backend/src/main/java/com/arjun/crm/entity/EmailCampaignHistory.java` (NEW)
- **Purpose**: Append-only audit log of all events
- **Fields**:
  - `campaignId` - Reference to campaign
  - `recipientId` - Reference to recipient
  - `eventType` - Type of event (SENT, DELIVERED, OPENED, CLICKED, BOUNCED, etc.)
  - `metadata` - Event-specific data (JSONB)
  - `providerEventId` - Unique Brevo event ID (prevents duplicates)
  - `processedAt` - When we processed the event

#### `crm-backend/src/main/java/com/arjun/crm/entity/EmailCampaignAnalyticsSnapshot.java` (NEW)
- **Purpose**: Pre-computed metrics for performance
- **Fields**:
  - `campaignId` - Campaign reference
  - `sentCount`, `deliveredCount`, `openedCount`, `clickedCount`, `bouncedCount`
  - `snapshotAt` - When metrics were computed

---

### 5. **Repositories** (Data Access)

#### `crm-backend/src/main/java/com/arjun/crm/repository/EmailCampaignHistoryRepository.java`
- **Methods**:
  - `findByCampaignIdOrderByProcessedAtDesc()` - Get audit trail
  - `findByProviderEventIdAndEventType()` - Check for duplicates
  - `findByRecipientId()` - Get recipient event history

#### `crm-backend/src/main/java/com/arjun/crm/repository/EmailCampaignAnalyticsSnapshotRepository.java`
- **Methods**:
  - `findFirstByCampaignIdOrderBySnapshotAtDesc()` - Latest metrics
  - `findByCampaignIdOrderBySnapshotAtDesc()` - Metrics history

---

### 6. **Database Migrations**

#### `crm-backend/db/migrations/V16__add_email_campaign_analytics_tracking.sql`
- **Tables Created**:
  1. `email_campaign_history` - Audit trail table
     - Columns: campaign_id, recipient_id, event_type, metadata, provider_event_id, processed_at
     - Indexes: campaign_id, recipient_id, provider_event_id (unique)
  
  2. `email_campaign_analytics_snapshot` - Metrics snapshots
     - Columns: campaign_id, sent_count, delivered_count, opened_count, clicked_count, bounced_count, snapshot_at
     - Indexes: campaign_id, snapshot_at

- **Column Additions**:
  - `email_campaign`: sent_count, delivered_count, opened_count, clicked_count, bounced_count, failed_count
  - `email_campaign_recipient`: deliveredAt, openedAt, firstClickedAt, lastClickedAt, clickCount, unsubscribedAt, bounceType

- **Status**: ✅ Ready, executes on startup

---

## 📍 FRONTEND ANALYTICS LOCATION

### 1. **Pages/Components**

#### `crm-frontend/src/pages/EmailCampaignDetails.jsx`
- **Purpose**: Main analytics display component
- **Analytics Features**:
  ```javascript
  // Analytics query hook
  const analytics = useQuery({
    queryKey: ['email-campaign-analytics', currentWorkspace?.id, id],
    queryFn: () => emailCampaignService.getAnalytics(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id
  })
  ```
  
- **Rate Calculations**:
  ```javascript
  const deliveryRate = metrics[0].value > 0 ? ((metrics[1].value / metrics[0].value) * 100).toFixed(1) : 0
  const openRate = metrics[1].value > 0 ? ((metrics[2].value / metrics[1].value) * 100).toFixed(1) : 0
  const clickRate = metrics[1].value > 0 ? ((metrics[3].value / metrics[1].value) * 100).toFixed(1) : 0
  ```

- **UI Sections**:
  1. **Main Metrics** (4 cards):
     - Recipients count
     - Delivered count
     - Opened count
     - Clicked count
  
  2. **Rate Metrics** (conditional, shows only if delivered > 0):
     - Delivery Rate %
     - Open Rate %
     - Click Rate (CTR) %
  
  3. **Recipients Table** (enhanced with):
     - Email address
     - Status (color-coded badges)
     - Delivered At (timestamp)
     - Opened At (timestamp)
     - Click Count (number)

- **Status**: ✅ Implemented (source code ready)
- **Build Status**: ⚠️ dist/ artifacts STALE (needs rebuild)

---

### 2. **Services**

#### `crm-frontend/src/services/emailCampaignService.js`
- **Method**: `getAnalytics(workspaceId, campaignId)`
  ```javascript
  async getAnalytics(workspaceId, campaignId) {
    return unwrap(await api.get(`${campaignPath(workspaceId, campaignId)}/analytics`))
  }
  ```
- **Purpose**: Fetch analytics from backend
- **Status**: ✅ Implemented

---

### 3. **Build Artifacts** ⚠️ STALE

#### `crm-frontend/dist/assets/index-DEVZnAzF.js`
- **Size**: 613.29 KB
- **Status**: ⚠️ Contains OLD version (missing analytics code)
- **Issue**: Not rebuilt after analytics feature implementation
- **Solution**: Requires `npm run build` with fresh dependencies

#### `crm-frontend/dist/assets/EmailCampaignDetails-DNlOR_19.js`
- **Size**: 6.63 KB
- **Status**: ⚠️ STALE (1,114 bytes smaller than source)
- **Issue**: Missing rate calculations and analytics UI
- **Solution**: Needs rebuild

---

## 📍 API ENDPOINTS

### Webhook Endpoint
```
POST /api/webhooks/brevo
Content-Type: application/json
No authentication required

Request:
{
  "event": "DELIVERED|OPENED|CLICKED|HARD_BOUNCE|SOFT_BOUNCE|SPAM|UNSUBSCRIBE|REPLY",
  "email": "recipient@example.com",
  "campaignId": 123,
  "recipientId": 456,
  "messageId": "brevo_message_id",
  "timestamp": "2026-08-05T15:00:00Z",
  "metadata": { ... }
}

Response:
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": null
}
```

### Analytics Endpoint
```
GET /api/workspaces/{workspaceId}/email-campaigns/{campaignId}/analytics
Authentication: Required (Bearer token)

Response:
{
  "success": true,
  "message": "Campaign analytics retrieved successfully",
  "data": {
    "campaignId": 123,
    "name": "Campaign Name",
    "totalRecipients": 100,
    "sentCount": 100,
    "deliveredCount": 95,
    "openedCount": 45,
    "clickedCount": 12,
    "bouncedCount": 5,
    "failedCount": 0
  }
}
```

---

## 📊 Data Flow Diagram

```
User Creates Campaign
    ↓
User Adds Recipients
    ↓
User Sends Campaign
    ↓
Backend sets recipients.status = "SENT"
Backend updates campaign.sentCount++
    ↓
Brevo Sends Emails
    ↓
Brevo Webhook → POST /api/webhooks/brevo
    ↓
BrevoWebhookController
    ↓
EmailAnalyticsServiceImpl.processWebhookEvent()
    ↓
Updates recipient (status, timestamps)
Updates campaign (metrics counters)
Records EmailCampaignHistory (audit trail)
    ↓
Frontend: GET /api/workspaces/{id}/email-campaigns/{id}/analytics
    ↓
React Query fetches metrics
    ↓
EmailCampaignDetails.jsx calculates rates
    ↓
UI displays:
  - Metrics cards
  - Rate percentages (if delivered > 0)
  - Recipients table with timestamps
```

---

## 🔗 Related Files

### Configuration
- `crm-backend/src/main/resources/application-dev.yml` - Dev configuration
- `crm-backend/src/main/resources/application-prod.yml` - Prod configuration
- `crm-backend/pom.xml` - Dependencies (includes Brevo SDK)

### Utilities
- `crm-backend/src/main/java/com/arjun/crm/exception/GlobalExceptionHandler.java` - Error handling
- `crm-backend/src/main/java/com/arjun/crm/listener/CacheEvictionListener.java` - Cache management

### Frontend Config
- `crm-frontend/src/services/api.js` - API client configuration
- `crm-frontend/vite.config.js` - Build configuration
- `crm-frontend/package.json` - Dependencies

---

## ✅ Implementation Checklist

### Backend (COMPLETE)
- ✅ `BrevoWebhookController` - Webhook receiver
- ✅ `EmailAnalyticsService` interface - Service contract
- ✅ `EmailAnalyticsServiceImpl` - Event processing logic
- ✅ `BrevoWebhookRequest` DTO - Payload validation
- ✅ `EmailCampaignAnalyticsResponse` DTO - Response format
- ✅ `EmailCampaignHistory` entity - Audit trail
- ✅ `EmailCampaignAnalyticsSnapshot` entity - Metrics cache
- ✅ `EmailCampaignHistoryRepository` - Data access
- ✅ `EmailCampaignAnalyticsSnapshotRepository` - Data access
- ✅ Database migration V16 - Schema updates
- ✅ `EmailCampaignController` analytics endpoint
- ✅ Maven build passing (mvn clean package -DskipTests)

### Frontend (CODE COMPLETE, BUILD STALE)
- ✅ `emailCampaignService.getAnalytics()` - API method
- ✅ `EmailCampaignDetails.jsx` - Analytics UI
- ✅ React Query integration - Data fetching
- ✅ Rate calculations - derivedMetrics
- ✅ Enhanced recipients table - Timestamps & badges
- ❌ `dist/` artifacts - NEEDS REBUILD

### Database (READY)
- ✅ Migration V16 created
- ✅ Tables designed
- ✅ Indexes created
- ✅ Ready for auto-execution

---

## 🚀 Deployment Status

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Backend Code | ✅ Ready | Deploy JAR |
| Backend Build | ✅ Success | Use built artifact |
| Frontend Code | ✅ Ready | Already in git |
| Frontend Build | ❌ Stale | `npm ci && npm run build` |
| Frontend Artifacts | ❌ Stale | Deploy new dist/ |
| Database Migrations | ✅ Ready | Auto-execute on startup |
| Brevo Webhooks | ⏳ Pending Config | Configure webhook URL in Brevo dashboard |

---

## 📝 Next Steps

1. **Rebuild Frontend**
   ```bash
   cd crm-frontend
   rm -rf dist node_modules
   npm ci
   npm run build
   ```

2. **Verify Build**
   - Check `dist/assets/index-*.js` is > 600KB
   - Search for "Delivery Rate" in dist files
   - Verify `deliveryRate` variable present

3. **Deploy**
   - Deploy backend JAR
   - Deploy new frontend dist/
   - Verify database migrations execute

4. **Configure Brevo**
   - Set webhook URL to: `https://yourdomain.com/api/webhooks/brevo`
   - Enable events: DELIVERED, OPENED, CLICKED, HARD_BOUNCE, SOFT_BOUNCE, SPAM, UNSUBSCRIBE

5. **Test**
   - Create campaign → Send → Verify analytics appear

---

## 📚 Documentation Files

- `EMAIL_ANALYTICS_ROOT_CAUSE_ANALYSIS.md` - Technical deep dive
- `ANALYTICS_INVESTIGATION_COMPLETE.txt` - Investigation report
- This file: Complete location map

---

**Summary**: Email analytics are fully implemented across all layers (Backend ✅, Frontend ✅, Database ✅). Only issue is stale build artifacts that need regeneration.
