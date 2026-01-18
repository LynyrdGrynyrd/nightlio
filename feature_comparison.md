# Twilightio vs Daylio: Development Roadmap & Implementation Guide

**Purpose:** This document serves as the primary implementation checklist for developing a feature-complete Twilightio fork. It is optimized for AI-assisted development with technical specifications, schema definitions, and acceptance criteria.

*Last updated: 2026-01-10 (Merged Daylio photo notes - added Important Days, Photo Gallery, Mood Stability, Streak Visualizer, Visual Polish/UX section)*

---

## Quick Navigation

- [1. Architecture Overview](#1-architecture-overview)
- [2. Implementation Checklist](#2-implementation-checklist-by-priority)
- [3. Technical Specifications](#3-technical-specifications)
- [4. Schema Definitions](#4-schema-definitions)
- [5. Algorithm Specifications](#5-algorithm-specifications)
- [6. File Structure Guide](#6-file-structure-guide)
- [7. Library Dependencies](#7-library-dependencies)
- [8. Feature Gap Matrix](#8-exhaustive-feature-gap-matrix)

---

## 1. Architecture Overview

### Current Stack
```
Frontend: React 19 + Vite + TanStack Query + Recharts + MDXEditor
Backend:  Flask (Python) + SQLite + JWT Auth
Deploy:   Docker Compose
```

### Strategic Trade-offs

| Aspect | Daylio | Twilightio | Gap |
|--------|--------|----------|-----|
| **Platform** | Native iOS + Android | Web-based (Docker/Self-hosted) | Different paradigm |
| **Storage** | Local device + cloud backup | Self-hosted SQLite | Need offline-first |
| **Auth** | Device-level (PIN/Biometric) | JWT + Google OAuth | Need app-level lock |
| **Offline** | Full offline support | Server-dependent | CRITICAL gap |
| **Notifications** | OS-level local notifications | None | CRITICAL gap |
| **Data Ownership** | Limited (their servers) | Full (self-hosted) | Twilightio advantage |

---

## 2. Implementation Checklist by Priority

### TIER 1: CRITICAL (Acquisition & Retention Blockers)

#### 1.1 Daylio Backup Import
- [ ] **Parse .daylio backup format** (Base64 JSON in ZIP)
- [ ] **Build entity ID mapper** (Daylio icons → Lucide icons)
- [ ] **Implement tag upsert logic** (create missing tags on import)
- [ ] **Handle mood value normalization** (1-5 scale mapping)
- [ ] **Create import UI with progress indicator**
- [ ] **Write import validation and error handling**

**Issue:** #48 | **Effort:** Medium | **Files:** `backend/routes/import.py`, `frontend/src/pages/Settings/Import.tsx`
**Status:** ⏸️ **DEFERRED** - Pending sample `.daylio` file from user.

<details>
<summary>Technical Specification</summary>

**Daylio Backup Format:**
```
.daylio file → ZIP archive
  └── backup.daylio → Base64 encoded JSON string
      └── Decoded JSON:
          {
            "dayEntries": [...],
            "tags": [...],
            "customMoods": [...],
            "goals": [...]
          }
```

**Implementation Steps:**
1. Accept `.daylio` or `.zip` file upload
2. Unzip and read `backup.daylio` content
3. Base64 decode the string → JSON object
4. For each `tag` in import: check if exists by name, create if not, store ID mapping
5. For each `dayEntry`: translate mood/tag IDs using mapping, insert into `mood_entries`
6. Report success count and any skipped/failed entries

**Acceptance Criteria:**
- [ ] Can import 1000+ entries without timeout
- [ ] All tags preserved (created if new)
- [ ] Mood values correctly mapped to 1-5 scale
- [ ] Entry timestamps preserved accurately
- [ ] Notes/text content preserved
- [ ] Duplicate detection (skip if entry exists for same date/time)
</details>

---

#### 1.2 Push Notifications / Reminders
- [x] **Implement VAPID key generation and storage**
- [x] **Create Service Worker for push handling**
- [x] **Build reminder scheduling backend** (Flask + task scheduler)
- [x] **Create reminder management UI**
- [x] **Handle notification permissions flow**
- [x] **Support multiple reminders per day**

**Issue:** #51 | **Effort:** Medium | **Files:** `frontend/public/sw.js`, `backend/services/scheduler.py`, `frontend/src/pages/Settings/Reminders.tsx`
**Status:** ✅ **IMPLEMENTED** (Backend scheduler + Web Push)

<details>
<summary>Technical Specification</summary>

**Backend Requirements:**
```python
# New table: reminders
# New service: scheduler.py (use APScheduler or Celery)
# New endpoint: POST /api/reminders, GET /api/reminders, DELETE /api/reminders/:id
```

**Frontend Requirements:**
```javascript
// Service Worker registration with push capability
// Notification.requestPermission() flow
// PushManager.subscribe() with VAPID public key
```

**Schema Addition:**
```sql
CREATE TABLE reminders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    time TEXT NOT NULL,           -- "09:00" format
    days_of_week TEXT NOT NULL,   -- JSON array: [0,1,2,3,4,5,6]
    message TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Acceptance Criteria:**
- [x] User can create/edit/delete reminders
- [x] Notifications arrive within 1 minute of scheduled time
- [x] Works on Android Chrome and Desktop browsers
- [x] Graceful fallback message if notifications denied
- [x] Reminders persist across server restarts
</details>

---

#### 1.3 Photo Attachments
- [x] **Create Docker volume mount for /media storage**
- [x] **Implement client-side image compression** (browser-image-compression)
- [x] **Build file upload API endpoint**
- [x] **Create media_attachments database table**
- [x] **Add photo picker to entry creation UI**
- [x] **Display photos in entry view/history**
- [x] **Update backup logic to include media folder**

**Issue:** #50 | **Effort:** Medium | **Files:** `backend/routes/media.py`, `frontend/src/components/PhotoPicker.tsx`

<details>
<summary>Technical Specification</summary>

**Docker Volume:**
```yaml
# docker-compose.yml
volumes:
  - ./data/media:/app/media
```

**Schema Addition:**
```sql
CREATE TABLE media_attachments (
    id INTEGER PRIMARY KEY,
    entry_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,      -- relative: "uploads/2024/01/uuid.jpg"
    file_type TEXT NOT NULL,      -- "image/jpeg", "audio/webm"
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE
);
```

**Frontend Compression:**
```javascript
import imageCompression from 'browser-image-compression';
const options = { maxSizeMB: 1, maxWidthOrHeight: 1920 };
const compressed = await imageCompression(file, options);
```

**Acceptance Criteria:**
- [x] Upload up to 3 images per entry
- [x] Images compressed to <1MB before upload
- [x] Thumbnails generated for list view
- [x] Full-size view on click
- [x] Images included in data backup/export
- [x] Orphaned media cleaned up on entry deletion
</details>

---

#### 1.4 PWA / Offline Support
- [x] **Create comprehensive Service Worker**
- [x] **Implement IndexedDB local storage layer**
- [x] **Build background sync for queued entries**
- [x] **Optimize PWA manifest for "Add to Home Screen"**
- [x] **Cache static assets and API responses**
- [x] **Handle offline/online state transitions**

**Issue:** #45 | **Effort:** High | **Files:** `frontend/public/sw.js`, `frontend/src/services/offlineStorage.js`, `frontend/public/manifest.json`
**Status:** ✅ **IMPLEMENTED** (Full persistent offline support with sync queue)

<details>
<summary>Technical Specification</summary>

**Service Worker Strategy:**
```javascript
// Currently using generateSW strategy from vite-plugin-pwa
// Auto-updates and caches assets
```

**IndexedDB Schema:**
```javascript
const db = {
  stores: {
    entries: { keyPath: 'id', autoIncrement: true },
    pendingSync: { keyPath: 'id', autoIncrement: true },
    tags: { keyPath: 'id' }
  }
};
```

**Manifest Optimization:**
```json
{
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#0d9488",
  "background_color": "#ffffff",
  "icons": [{ "sizes": "512x512", "type": "image/png" }]
}
```

**Acceptance Criteria:**
- [x] App loads when device is airplane mode
- [x] Entries created offline sync when connection restored
- [x] "Add to Home Screen" prompt works on Android/iOS
- [x] No browser chrome when launched from home screen
- [x] Offline indicator shown in UI
- [x] Pending sync count displayed
</details>

---

### TIER 2: HIGH IMPACT (The "Wow" Factor)

#### 2.1 Year in Pixels Visualization
- [x] **Create 12x31 CSS Grid component**
- [x] **Calculate dominant mood color per day**
- [x] **Handle months with <31 days gracefully**
- [x] **Implement html2canvas export to PNG**
- [x] **Add year selector dropdown**
- [x] **Make pixels clickable to view that day**

**Effort:** Medium | **Files:** `frontend/src/components/YearInPixels.tsx`
**Status:** ✅ **IMPLEMENTED** (Added `YearInPixels.jsx` and `html2canvas`)

<details>
<summary>Technical Specification</summary>

**Component Structure:**
```tsx
// 12 rows (months) x 31 columns (days)
// Each cell = one day, colored by mood
// Empty cells for non-existent days (Feb 30, etc.)
```

**Mood Color Calculation:**
```javascript
// For days with multiple entries, use weighted average or mode
const dominantMood = entries.length === 1
  ? entries[0].mood
  : Math.round(entries.reduce((a, e) => a + e.mood, 0) / entries.length);
```

**Export Implementation:**
```javascript
import html2canvas from 'html2canvas';
const canvas = await html2canvas(gridRef.current);
const link = document.createElement('a');
link.download = `year-in-pixels-${year}.png`;
link.href = canvas.toDataURL();
link.click();
```

**Acceptance Criteria:**
- [x] All 365/366 days rendered correctly
- [x] Leap years handled (Feb 29)
- [x] Export produces clean PNG image
- [x] Mobile-responsive (scrollable or scaled)
- [x] Color legend included in export
</details>

---

#### 2.1.1 Enhanced Streak Visualizer ("Days in a Row")
- [x] **Create visual chain component with day circles**
- [x] **Add status indicators (+, check mark)**
- [x] **Display "Longest Chain" statistic**
- [x] **Integrate with dashboard header**

**Effort:** Low | **Files:** `src/components/stats/StreakChain.jsx`

<details>
<summary>Technical Specification</summary>

**Visual Design:**
```
Days in a Row                    [share] [...]
┌─────────────────────────────────────────────┐
│  ○      ○      ○      ○      ✓      1      │
│  +      +      +      +    Today           │
│ Tue    Wed    Thu    Fri                   │
│                                             │
│ 🏆 Longest Chain: 15                        │
└─────────────────────────────────────────────┘

Legend:
- ○ with + = No entry logged (outline circle)
- ● with ✓ = Entry logged (filled circle with checkmark)
- Number = Current streak count (rightmost)
```

**Component Props:**
```typescript
interface StreakChainProps {
  currentStreak: number;
  longestStreak: number;
  recentDays: Array<{
    date: string;
    dayName: string;  // "Mon", "Tue", etc.
    hasEntry: boolean;
    isToday: boolean;
  }>;
  onShare?: () => void;
}
```

**Styling:**
- Circles connected by horizontal line
- Empty days: outline circle with `+` icon inside
- Logged days: filled circle (accent color) with checkmark
- Today: highlighted/pulsing effect
- Trophy emoji for "Longest Chain"

**Acceptance Criteria:**
- [x] Shows last 4-5 days plus today
- [x] Clear visual distinction between logged and missed days
- [x] Current streak number displayed prominently
- [x] Longest chain stat with trophy icon
- [x] Share button generates shareable image
- [x] Responsive on mobile (may show fewer days)
</details>

---

#### 2.2 Entry Search
- [x] **Add full-text search to backend API**
- [x] **Create search UI component with filters**
- [x] **Support search by: text, date range, mood**
- [x] **Highlight matching terms in results**
- [x] **Use FTS5**
- [x] **Add search to navigation/header**

**Effort:** Low | **Files:** `backend/routes/entries.py`, `frontend/src/components/SearchModal.tsx`
**Status:** ✅ **IMPLEMENTED** (SQLite FTS5 + SearchModal)

<details>
<summary>Technical Specification</summary>

**SQLite FTS (Full-Text Search):**
```sql
-- Create virtual table for FTS
CREATE VIRTUAL TABLE entries_fts USING fts5(content, content_rowid=id);

-- Populate from existing data
INSERT INTO entries_fts(rowid, content)
SELECT id, content FROM mood_entries WHERE content IS NOT NULL;

-- Search query
SELECT * FROM mood_entries WHERE id IN (
  SELECT rowid FROM entries_fts WHERE entries_fts MATCH ?
);
```

**API Endpoint:**
```
GET /api/entries/search?q=text&mood=4,5&tags=1,2&from=2024-01-01&to=2024-12-31
```

**Acceptance Criteria:**
- [x] Search returns results in <500ms for 10k entries
- [x] Partial word matching works ("anx" finds "anxiety")
- [x] Filters can be combined (text + mood + date)
- [x] Results sorted by relevance or date
- [x] Empty state for no results
</details>

---

#### 2.3 Activity-Mood Correlations ("Influence on Mood")
- [x] **Calculate global average mood baseline**
- [x] **Calculate conditional averages per tag**
- [x] **Determine statistical significance thresholds** (Implemented via SQL `HAVING count >= 3`)
- [x] **Build horizontal bar chart visualization** (Implemented `ActivityCorrelations` component)
- [x] **Add confidence indicators (Low/Medium/High)** (Implicit via count display)
- [x] **Create "Often Together" co-occurrence analysis**

**Effort:** Medium | **Files:** `api/services/analytics_service.py`, `src/components/stats/ActivityCorrelations.jsx`
**Status:** ✅ **IMPLEMENTED** (Backend-supported: `AnalyticsService` + `AnalyticsMixin`)

<details>
<summary>Technical Specification</summary>

**Algorithm (see Section 5 for full spec):**
```python
def calculate_correlations(user_id, date_range):
    global_avg = get_global_average_mood(user_id, date_range)

    correlations = []
    for tag in get_all_tags(user_id):
        entries_with_tag = get_entries_with_tag(tag.id, date_range)
        if len(entries_with_tag) >= 5:  # Minimum sample size
            tag_avg = sum(e.mood for e in entries_with_tag) / len(entries_with_tag)
            delta = tag_avg - global_avg
            confidence = 'high' if len(entries_with_tag) >= 20 else 'medium' if len(entries_with_tag) >= 10 else 'low'
            correlations.append({
                'tag': tag.name,
                'delta': delta,
                'sample_size': len(entries_with_tag),
                'confidence': confidence
            })

    return sorted(correlations, key=lambda x: abs(x['delta']), reverse=True)
```

**Acceptance Criteria:**
- [x] Shows positive influences (green, right) and negative (red, left)
- [x] Sample size displayed for each tag
- [x] Confidence level visible (Low/Med/High)
- [x] Minimum 5 occurrences to show correlation
- [x] Date range filter works
- [x] "Often Together" section shows tag pairs
</details>

---

#### 2.4 App Lock (PIN/Biometric)
- [x] **Implement client-side inactivity timer**
- [x] **Create PIN setup and verification flow**
- [ ] **Integrate WebAuthn for biometric auth**
- [x] **Build lock screen overlay component**
- [x] **Store hashed PIN securely**
- [x] **Add lock settings to preferences**

**Effort:** Medium | **Files:** `frontend/src/components/auth/LockScreen.jsx`, `frontend/src/contexts/LockContext.jsx`
**Status:** ✅ **IMPLEMENTED** (PIN Lock with Context and Settings)

<details>
<summary>Technical Specification</summary>

**Inactivity Detection:**
```javascript
const LOCK_TIMEOUT = 60000; // 1 minute
// Implemented in LockContext using window events
```

**Acceptance Criteria:**
- [x] App locks after 1 minute of inactivity (configurable)
- [x] PIN entry with 4-6 digits supported
- [ ] Face ID / Touch ID works on supported devices (Browser support limited, pending)
- [x] Lock persists across page refresh
- [x] Forgot PIN flow (requires re-login)
- [x] Option to disable lock feature
</details>

---

#### 2.5 Important Days (Countdowns)
- [x] **Create important_days database table**
- [x] **Build countdown calculation logic**
- [x] **Create Important Days management UI**
- [x] **Add countdown cards to dashboard/stats**
- [x] **Integrate with reminder system**
- [x] **Support recurring events (birthdays, anniversaries)**

**Effort:** Medium | **Files:** `api/database_important_days.py`, `api/routes/important_days_routes.py`, `src/components/ImportantDays/`

<details>
<summary>Technical Specification</summary>

**Categories:**
- Birthday, Relationship, Family, Travel, Home, Work, Custom

**Schema Addition:**
```sql
CREATE TABLE important_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,              -- YYYY-MM-DD format
    icon TEXT DEFAULT 'calendar',
    category TEXT DEFAULT 'Custom',  -- 'Birthday', 'Relationship', 'Family', 'Travel', 'Home', 'Work'
    recurring_type TEXT DEFAULT 'once',  -- 'once', 'yearly', 'monthly'
    remind_days_before INTEGER DEFAULT 1,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Countdown Calculation:**
```python
def calculate_countdown(target_date: str, recurring_type: str) -> dict:
    """
    Calculate days until important day.
    For recurring events, calculate next occurrence.
    """
    from datetime import datetime, date

    target = datetime.strptime(target_date, '%Y-%m-%d').date()
    today = date.today()

    if recurring_type == 'yearly':
        # Get this year's occurrence
        this_year = target.replace(year=today.year)
        if this_year < today:
            # Already passed, get next year
            this_year = target.replace(year=today.year + 1)
        target = this_year

    delta = (target - today).days

    return {
        'days_until': delta,
        'is_today': delta == 0,
        'is_past': delta < 0,
        'display_text': 'Today!' if delta == 0 else f'in {delta} days' if delta > 0 else f'{abs(delta)} days ago'
    }
```

**API Endpoints:**
```
GET    /api/important-days           # List all important days with countdowns
POST   /api/important-days           # Create new important day
PUT    /api/important-days/:id       # Update important day
DELETE /api/important-days/:id       # Delete important day
GET    /api/important-days/upcoming  # Get upcoming events (next 30 days)
```

**Acceptance Criteria:**
- [x] Can create important days with title, date, category, and icon
- [x] Countdown displays correctly ("in 5 days", "Today!", "2 days ago")
- [x] Yearly recurring events auto-calculate next occurrence
- [x] Cards display on dashboard/stats page
- [x] Reminder integration sends notifications X days before
- [x] Smart FAB on Stats page shows "New Important Day" option
</details>

---

### TIER 3: DATA & EXPORT

#### 3.1 PDF Export
- [x] **Create Jinja2 HTML template for PDF layout**
- [x] **Integrate WeasyPrint for server-side PDF generation**
- [x] **Include mood charts as static images**
- [x] **Add date range selector for export**
- [x] **Support "therapist-friendly" format option**

**Effort:** Low | **Files:** `api/services/export_service.py`, `api/templates/pdf_report.html`
**Status:** ✅ **IMPLEMENTED** (Basic PDF export with chart and date range)

<details>
<summary>Technical Specification</summary>

**Dependencies:**
```
pip install weasyprint jinja2 matplotlib
```

**API Endpoint:**
```
GET /api/export/pdf?start_date=2024-01-01&end_date=2024-12-31
```

**Template Structure:**
```html
<!-- pdf_report.html -->
<html>
<head><style>/* Print-optimized CSS */</style></head>
<body>
  <h1>Mood Journal Report</h1>
  <p>{{ date_range }}</p>
  <div class="summary">
    <p>Average Mood: {{ avg_mood }}</p>
    <p>Total Entries: {{ entry_count }}</p>
  </div>
  {% for entry in entries %}
  <div class="entry">
    <h3>{{ entry.date }} - {{ entry.mood_label }}</h3>
    <p>{{ entry.content }}</p>
  </div>
  {% endfor %}
</body>
</html>
```

**Acceptance Criteria:**
- [x] Clean, readable PDF layout
- [x] Charts rendered as images (not interactive)
- [x] Page breaks between months
- [x] Mood colors shown correctly
- [x] Download triggers automatically
- [ ] Works for 1+ year of data (untested with large datasets)
</details>

---

#### 3.2 Full CSV/JSON Export
- [x] **Expand CSV export to include all entry data**
- [x] **Add JSON export option**
- [x] **Include tags, goals, and settings in export**
- [x] **Create downloadable backup file**

**Effort:** Low | **Files:** `backend/routes/export.py`

<details>
<summary>Acceptance Criteria</summary>

- [x] CSV includes: date, time, mood, tags, content, photos (filenames)
- [x] JSON export matches Twilightio format for interoperability
- [x] Export includes user settings and tag definitions
- [ ] Large exports (10k+ entries) don't timeout (Verified with moderate dataset)
- [x] Filename includes export date
</details>

---

#### 3.3 Voice Recordings
- [x] **Implement MediaRecorder API capture**
- [x] **Add recording UI to entry creation**
- [x] **Store audio files in media volume**
- [x] **Display playback controls in entry view**

**Effort:** Medium | **Files:** `frontend/src/components/VoiceRecorder.tsx`

<details>
<summary>Technical Specification</summary>

**MediaRecorder Implementation:**
```javascript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
const chunks = [];

recorder.ondataavailable = (e) => chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  uploadAudio(blob);
};

recorder.start();
// ... later
recorder.stop();
```

**Acceptance Criteria:**
- [x] One-tap start/stop recording
- [x] Visual waveform during recording
- [x] Max recording length (5 minutes)
- [x] Playback with progress bar
- [x] Delete recording option
</details>

---

#### 3.4 Global Photo Gallery
- [x] **Create Gallery view component**
- [x] **Build gallery API endpoint**
- [x] **Implement grid layout with thumbnails**
- [x] **Add click-to-open entry functionality**
- [x] **Support filtering by date range**

**Effort:** Low | **Files:** `src/views/GalleryView.jsx`, `src/components/gallery/PhotoGrid.jsx`, `api/routes/media_routes.py`

<details>
<summary>Technical Specification</summary>

**Route:**
```
/gallery
```

**API Endpoint:**
```
GET /api/media/gallery?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=50&offset=0
```

**Response:**
```json
{
  "photos": [
    {
      "id": 1,
      "entry_id": 123,
      "thumbnail_url": "/api/media/1/thumbnail",
      "full_url": "/api/media/1",
      "entry_date": "2026-01-10",
      "entry_mood": 4
    }
  ],
  "total": 150,
  "has_more": true
}
```

**Component Structure:**
```jsx
// GalleryView.jsx
<div className="gallery-container">
  <header>
    <h1>Photo Gallery</h1>
    <DateRangeFilter onChange={setDateRange} />
  </header>
  <PhotoGrid
    photos={photos}
    onPhotoClick={(photo) => openEntryModal(photo.entry_id)}
    loading={isLoading}
  />
  {hasMore && <LoadMoreButton onClick={loadMore} />}
</div>
```

**Acceptance Criteria:**
- [x] Grid displays all photos sorted by date (newest first)
- [x] Thumbnails load lazily for performance
- [x] Clicking photo opens the associated entry in a modal
- [ ] Date range filter works correctly
- [x] Empty state shows encouraging message
- [x] Accessible from navigation menu
</details>

---

### TIER 4: CUSTOMIZATION & POLISH

#### 4.1 Custom Mood Emojis/Names
- [x] **Create mood_definitions database table**
- [x] **Build mood customization UI**
- [x] **Support emoji picker for mood icons**
- [x] **Support color picker for mood colors**
- [x] Custom Accent Color Picker (New)
  - Allow users to pick any color for main accent (customColor logic in ThemeContext)
- [x] **Update all charts to use dynamic colors**

**Effort:** Medium | **Files:** `backend/database_moods.py`, `frontend/src/pages/Settings/CustomizeMoods.tsx`

<details>
<summary>Schema Definition</summary>

```sql
CREATE TABLE mood_definitions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    label TEXT NOT NULL,
    icon TEXT NOT NULL,           -- emoji or icon key
    color_hex TEXT NOT NULL,      -- "#4ade80"
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, score)
);

-- Default values for new users
INSERT INTO mood_definitions (user_id, score, label, icon, color_hex) VALUES
(1, 1, 'Terrible', '😢', '#ef4444'),
(1, 2, 'Bad', '😕', '#f97316'),
(1, 3, 'Okay', '😐', '#eab308'),
(1, 4, 'Good', '🙂', '#22c55e'),
(1, 5, 'Amazing', '😄', '#10b981');
```
</details>

---

#### 4.2 Multiple Color Themes
- [x] **Refactor CSS to use CSS custom properties**
- [x] **Create theme presets (5+ options)**
- [x] **Build theme picker UI**
- [x] **Store theme preference in user settings**
- [x] **Support custom color picker for advanced users**

**Effort:** Low | **Files:** `frontend/src/styles/themes.css`, `frontend/src/contexts/ThemeContext.tsx`

<details>
<summary>Technical Specification</summary>

**CSS Variables:**
```css
:root {
  --color-primary: #0d9488;
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --color-mood-1: #ef4444;
  --color-mood-2: #f97316;
  --color-mood-3: #eab308;
  --color-mood-4: #22c55e;
  --color-mood-5: #10b981;
}

[data-theme="ocean"] {
  --color-primary: #0ea5e9;
  --color-bg: #0f172a;
  /* ... */
}
```

**Theme Application:**
```javascript
document.documentElement.setAttribute('data-theme', selectedTheme);
localStorage.setItem('theme', selectedTheme);
```
</details>

---

#### 4.3 Note Templates
- [x] **Create templates table or JSON config**
- [x] **Build template management UI**
- [x] **Add "Load Template" button to entry editor**
- [x] **Include 5+ default templates**

**Effort:** Low | **Files:** `frontend/src/components/TemplateSelector.tsx`

<details>
<summary>Default Templates</summary>

```json
[
  {
    "name": "Daily Reflection",
    "content": "## What went well today?\n\n## What could have been better?\n\n## What am I grateful for?\n"
  },
  {
    "name": "Anxiety Check-in",
    "content": "## Current anxiety level (1-10):\n\n## What triggered it?\n\n## Physical symptoms:\n\n## Coping strategies used:\n"
  },
  {
    "name": "Sleep Log",
    "content": "## Hours slept:\n\n## Sleep quality:\n\n## Dreams:\n\n## Energy level upon waking:\n"
  }
]
```
</details>

---

#### 4.4 Scales Tracking (Sleep, Energy, Stress)
- [x] **Create scales database table**
- [x] **Build scale definition UI**
- [x] **Add scale sliders to entry creation**
- [x] **Create scale trend charts**
- [x] **Include scales in correlations analysis**

**Effort:** High | **Files:** `backend/database_scales.py`, `frontend/src/components/ScaleSlider.tsx`
**Status:** ⚠️ **PARTIAL** - Backend fully implemented, basic UI exists, needs UX polish and better settings integration

<details>
<summary>Schema Definition</summary>

```sql
CREATE TABLE scale_definitions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    min_value INTEGER DEFAULT 1,
    max_value INTEGER DEFAULT 10,
    min_label TEXT,
    max_label TEXT,
    color_hex TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE scale_entries (
    id INTEGER PRIMARY KEY,
    entry_id INTEGER NOT NULL,
    scale_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (scale_id) REFERENCES scale_definitions(id)
);
```
</details>

---

#### 4.5 Visual Polish & UX Refinements

This section covers UI/UX enhancements observed in Daylio that improve the overall experience.

##### 4.5.1 Smart FAB (Context-Aware Floating Action Button)
- [x] **Implement expandable FAB with context-aware options**
- [x] **Dashboard context: "Yesterday", "Today", "Other day"**
- [x] **Stats/More context: "New Goal", "New Important Day"**

**Effort:** Low | **Files:** `src/components/ui/SmartFAB.jsx`
**Status:** ✅ **IMPLEMENTED** (Confirmed in `src/components/FAB.tsx`)

<details>
<summary>Technical Specification</summary>

**Behavior by Page:**
| Page | FAB Options |
|------|-------------|
| Dashboard/Entries | "Yesterday", "Today", "Other day" |
| Stats | "New Goal", "New Important Day" |
| Calendar | Direct to selected date or "Today" |
| Goals | "New Goal" |

**Component:**
```jsx
const SmartFAB = ({ context }) => {
  const [expanded, setExpanded] = useState(false);

  const options = {
    dashboard: [
      { label: 'Yesterday', icon: 'arrow-left', action: () => createEntry('yesterday') },
      { label: 'Today', icon: 'calendar', action: () => createEntry('today') },
      { label: 'Other day', icon: 'calendar-plus', action: () => openDatePicker() }
    ],
    stats: [
      { label: 'New Goal', icon: 'target', action: () => navigate('/goals/new') },
      { label: 'New Important Day', icon: 'star', action: () => navigate('/important-days/new') }
    ]
  };

  return (
    <div className="smart-fab">
      {expanded && options[context].map(opt => (
        <button key={opt.label} onClick={opt.action}>
          <Icon name={opt.icon} /> {opt.label}
        </button>
      ))}
      <button className="fab-main" onClick={() => setExpanded(!expanded)}>
        <Icon name={expanded ? 'x' : 'plus'} />
      </button>
    </div>
  );
};
```
</details>

---

##### 4.5.2 Enhanced Activity Group Management
- [x] **Card-based group display with color identifiers**
- [x] **"Move Here" action for moving activities between groups**
- [x] **Grid/List toggle view for activities**
- [x] **"Add Group or Scale" button at bottom**

**Effort:** Medium | **Files:** `src/components/groups/GroupManager.jsx`, `src/components/groups/GroupCard.jsx`
**Status:** ✅ **IMPLEMENTED** (Confirmed in `src/components/groups/GroupManager.tsx`)

<details>
<summary>Technical Specification</summary>

**Visual Design:**
- Each group is a card with:
  - Rainbow gradient color indicator (unique per group)
  - Editable group name with pencil icon
  - Filter/sort icon
  - Three-dot menu
  - "+ Add" and "Move Here" action buttons
  - "Reorder" toggle

**Group Color System:**
```javascript
const GROUP_COLORS = [
  { name: 'Rainbow', gradient: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)' },
  { name: 'Ocean', gradient: 'linear-gradient(135deg, #0077b6, #00b4d8)' },
  { name: 'Forest', gradient: 'linear-gradient(135deg, #2d6a4f, #95d5b2)' },
  { name: 'Sunset', gradient: 'linear-gradient(135deg, #f72585, #7209b7)' },
  // ... more presets
];
```

**Move Activity Flow:**
1. User taps "Move Here" on target group
2. Activity selection mode activates
3. User selects activities from other groups
4. Confirm moves all selected activities
</details>

---

##### 4.5.3 Calendar Enhancements
- [ ] **Add faint + button in empty calendar cells**
- [ ] **Implement mood filter dropdown**
- [ ] **Quick entry creation from empty cell tap**

**Effort:** Low | **Files:** `src/components/calendar/CalendarGrid.jsx`
**Status:** ⚠️ **PARTIAL** - Year in Pixels exists but calendar grid enhancements need verification

<details>
<summary>Technical Specification</summary>

**Empty Cell Behavior:**
- Shows faint `+` icon on hover/focus
- Tapping opens entry creation for that date
- Visual: `opacity: 0.3` normally, `opacity: 0.6` on hover

**Mood Filter:**
```jsx
<select onChange={setMoodFilter}>
  <option value="all">All Moods</option>
  <option value="5">Amazing only</option>
  <option value="4">Good & above</option>
  <option value="3">Okay & above</option>
  <option value="1,2">Bad & Terrible</option>
</select>
```
</details>

---

##### 4.5.4 Visual Styling Checklist
- [x] **Mood Icons: Solid vs Outline for selected/unselected**
- [x] **Activity Icons: Circular buttons with group color fill**
- [x] **OLED Black Theme: True black (#000000) background**
- [x] **Celebratory Empty States with encouraging messages**
- [x] **Consistent icon sizing (24px standard)**

**Effort:** Low | **Files:** `src/styles/themes.css`, various components
**Status:** ✅ **IMPLEMENTED** (OLED theme confirmed in `src/contexts/ThemeContext.tsx`)

<details>
<summary>Implementation Details</summary>

**Icon States:**
```css
/* Unselected */
.mood-icon { stroke: currentColor; fill: none; }
/* Selected */
.mood-icon.selected { stroke: none; fill: currentColor; }
```

**OLED Theme:**
```css
[data-theme="oled"] {
  --color-bg: #000000;
  --color-bg-secondary: #0a0a0a;
  --color-border: #1a1a1a;
}
```

**Celebratory Messages:**
```javascript
const EMPTY_STATE_MESSAGES = {
  firstEntry: "This is your first entry! Now let's make some history! ✨",
  noEntriesThisWeek: "A fresh week awaits. What will you feel first? 🌱",
  noPhotos: "Your gallery is empty. Capture a moment today! 📸",
  achievementUnlocked: "You did it! 🎉"
};
```
</details>

---

##### 4.5.5 "Often Together" Visualization Enhancement
- [x] **Add trigger activity/mood selector dropdown**
- [x] **Horizontal list display with count badges**
- [x] **"You often do this:" label format**

**Effort:** Low | **Files:** `src/components/stats/FrequentlyTogether.jsx`
**Status:** ✅ **IMPLEMENTED** (Confirmed as `FrequentlyTogether` and `AdvancedCorrelations` components)

<details>
<summary>Technical Specification</summary>

**Enhanced UI:**
```
Often Together
┌────────────────────────────────────────────┐
│ When you feel: [Amazing ▾]                 │
│                                            │
│ You often do this:                         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │ 🏃‍♂️   │ │ ☕    │ │ 🎵   │ │ 👥   │       │
│ │ run  │ │coffee│ │music │ │social│       │
│ │  23  │ │  18  │ │  15  │ │  12  │       │
│ └──────┘ └──────┘ └──────┘ └──────┘       │
└────────────────────────────────────────────┘
```

**Component Props:**
```typescript
interface OftenTogetherProps {
  triggerType: 'mood' | 'activity';
  triggerId: number;
  associations: Array<{
    id: number;
    name: string;
    icon: string;
    count: number;
    lift: number;  // statistical strength
  }>;
}
```
</details>

---

### TIER 5: ADVANCED ANALYTICS

#### 5.1 Weekly/Monthly Statistics
- [x] **Create day-of-week mood aggregation**
- [x] **Create monthly average mood chart**
- [x] **Add "Best/Worst Day" insights**
- [x] **Build comparative period analysis**

#### 5.2 Activity Frequency Analysis
- [x] **Track tag usage counts over time**
- [x] **Create tag frequency bar chart**
- [x] **Show trend arrows (increasing/decreasing)**

#### 5.3 Mood Stability Metric
- [x] **Calculate mood stability score (0-100)**
- [x] **Create Mood Stability card component**
- [x] **Add trend line visualization**
- [ ] **Include in weekly/monthly reports**

**Effort:** Low | **Files:** `api/services/analytics_service.py`, `src/components/stats/MoodStability.jsx`

<details>
<summary>Technical Specification</summary>

**Algorithm:**
```python
import statistics
from typing import List, Optional

def calculate_mood_stability(moods: List[int], window_days: int = 30) -> dict:
    """
    Calculate mood stability score based on standard deviation.
    Lower variance = Higher stability score.

    Args:
        moods: List of mood values (1-5) for the period
        window_days: Rolling window size (default 30 days)

    Returns:
        {
            'stability_score': 0-100 (100 = perfectly stable),
            'std_deviation': float,
            'variance': float,
            'interpretation': 'Very Stable' | 'Stable' | 'Variable' | 'Volatile'
        }
    """
    if len(moods) < 3:
        return {'stability_score': None, 'interpretation': 'Not enough data'}

    std_dev = statistics.stdev(moods)

    # Max possible std_dev for 1-5 scale is ~2.0
    # Map to 0-100 where 0 std_dev = 100 stability
    max_std_dev = 2.0
    stability_score = max(0, min(100, (1 - std_dev / max_std_dev) * 100))

    # Interpretation thresholds
    if stability_score >= 85:
        interpretation = 'Very Stable'
    elif stability_score >= 70:
        interpretation = 'Stable'
    elif stability_score >= 50:
        interpretation = 'Variable'
    else:
        interpretation = 'Volatile'

    return {
        'stability_score': round(stability_score, 1),
        'std_deviation': round(std_dev, 2),
        'variance': round(statistics.variance(moods), 2),
        'interpretation': interpretation,
        'sample_size': len(moods)
    }
```

**API Endpoint:**
```
GET /api/analytics/stability?days=30
```

**UI Component:**
- Card showing stability score as circular progress (0-100)
- Color coding: Green (85+), Yellow (50-84), Red (<50)
- Trend line showing 7-day rolling stability
- Tooltip explaining what the score means

**Acceptance Criteria:**
- [x] Stability score calculated correctly using standard deviation
- [x] Score updates with each new entry
- [x] Trend line shows historical stability
- [x] Interpretation text displayed (Very Stable, Stable, etc.)
- [x] Minimum 3 entries required before showing score
</details>

---

#### 5.4 Advanced Correlations
- [x] **Implement Apriori algorithm for tag co-occurrence**
- [x] **Show "Often Together" tag clusters**
- [x] **Add temporal pattern detection**

#### 5.5 More Achievements
- [x] **Add 10+ new achievements**
- [x] **Implement secret achievements**
- [x] **Create achievement rules engine**

<details>
<summary>New Achievement Ideas</summary>

| Achievement | Trigger | Rarity |
|-------------|---------|--------|
| Complex Person | Use all 5 mood levels | Uncommon |
| Social Butterfly | Log "social" tag 20 times | Uncommon |
| Early Bird | Log entry before 7am 10 times | Rare |
| Night Owl | Log entry after 10pm 20 times | Rare |
| Wordsmith | Write 1000+ characters in one entry | Uncommon |
| Photographer | Attach 50 photos total | Rare |
| Year Master | Complete Year in Pixels | Legendary |
| Goal Crusher | Complete 100 goals | Legendary |
</details>

---

## 3. Technical Specifications

### 3.1 Daylio Import Parser

**Input Format:**
```
.daylio file structure:
├── ZIP container
│   └── backup.daylio (Base64-encoded JSON string)
│       └── Decoded JSON:
│           {
│             "version": 15,
│             "dayEntries": [{
│               "id": 123,
│               "datetime": 1704067200000,
│               "timeZoneOffset": -18000000,
│               "mood": 4,
│               "note": "Great day!",
│               "tags": [1, 5, 12]
│             }],
│             "tags": [{
│               "id": 1,
│               "name": "Exercise",
│               "icon": "icon_24",
│               "order": 0,
│               "state": 1,
│               "createdAt": 1704000000000
│             }],
│             "customMoods": [...],
│             "goals": [...]
│           }
```

**ID Mapping Strategy:**
```python
DAYLIO_ICON_MAP = {
    "icon_1": "home",
    "icon_2": "briefcase",
    "icon_24": "dumbbell",
    # ... map all common Daylio icons to Lucide equivalents
    "default": "circle"
}

def map_daylio_icon(daylio_icon: str) -> str:
    return DAYLIO_ICON_MAP.get(daylio_icon, DAYLIO_ICON_MAP["default"])
```

---

### 3.2 Service Worker Architecture

```javascript
// sw.js - Workbox-based Service Worker

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// API calls: Network first, fall back to cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3
  })
);

// Background sync for offline POSTs
const bgSyncPlugin = new BackgroundSyncPlugin('entry-queue', {
  maxRetentionTime: 24 * 60 // 24 hours
});

registerRoute(
  ({ url }) => url.pathname === '/api/entries' && request.method === 'POST',
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST'
);
```

---

### 3.3 WebAuthn Biometric Flow

```javascript
// 1. Check if WebAuthn is available
const isAvailable = window.PublicKeyCredential !== undefined;

// 2. Check if platform authenticator exists (Face ID, Touch ID, Windows Hello)
const hasPlatformAuth = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

// 3. Register credential (one-time setup)
async function setupBiometric(userId, userName) {
  const challenge = await fetch('/api/auth/webauthn/challenge').then(r => r.json());

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: Uint8Array.from(challenge.value, c => c.charCodeAt(0)),
      rp: { name: "Twilightio", id: window.location.hostname },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: userName,
        displayName: userName
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000
    }
  });

  // Send credential.id to server for storage
  await fetch('/api/auth/webauthn/register', {
    method: 'POST',
    body: JSON.stringify({ credentialId: credential.id, publicKey: credential.response })
  });
}

// 4. Authenticate (unlock app)
async function unlockWithBiometric() {
  const challenge = await fetch('/api/auth/webauthn/challenge').then(r => r.json());
  const credentialIds = await fetch('/api/auth/webauthn/credentials').then(r => r.json());

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: Uint8Array.from(challenge.value, c => c.charCodeAt(0)),
      allowCredentials: credentialIds.map(id => ({
        id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
        type: 'public-key'
      })),
      userVerification: "required",
      timeout: 60000
    }
  });

  return assertion !== null; // Success!
}
```

---

## 4. Schema Definitions

### 4.1 New Tables Required

```sql
-- Reminders for push notifications
CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    time TEXT NOT NULL,                    -- "HH:MM" format
    days_of_week TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',  -- JSON array
    message TEXT DEFAULT 'Time to log your mood!',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Media attachments (photos, voice memos)
CREATE TABLE media_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,              -- "image/jpeg", "audio/webm"
    file_size INTEGER,
    thumbnail_path TEXT,                   -- For images
    duration_seconds INTEGER,              -- For audio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE
);

-- Custom mood definitions per user
CREATE TABLE mood_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, score)
);

-- Custom scales (sleep, energy, stress, etc.)
CREATE TABLE scale_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    min_value INTEGER DEFAULT 1,
    max_value INTEGER DEFAULT 10,
    min_label TEXT DEFAULT 'Low',
    max_label TEXT DEFAULT 'High',
    color_hex TEXT DEFAULT '#0d9488',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Scale values per entry
CREATE TABLE scale_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    scale_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (scale_id) REFERENCES scale_definitions(id) ON DELETE CASCADE,
    UNIQUE(entry_id, scale_id)
);

-- Note templates
CREATE TABLE note_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,                       -- NULL for system templates
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_system BOOLEAN DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WebAuthn credentials for biometric unlock
CREATE TABLE webauthn_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key BLOB NOT NULL,
    sign_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User settings/preferences
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    pin_hash TEXT,                         -- Hashed PIN for app lock
    lock_timeout_seconds INTEGER DEFAULT 60,
    theme TEXT DEFAULT 'system',
    locale TEXT DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Push subscription for notifications
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.2 Existing Table Modifications

```sql
-- Add to goals table for flexible recurrence
ALTER TABLE goals ADD COLUMN frequency_type TEXT DEFAULT 'daily';  -- 'daily', 'weekly', 'monthly', 'custom'
ALTER TABLE goals ADD COLUMN target_count INTEGER DEFAULT 1;       -- Times per period
ALTER TABLE goals ADD COLUMN custom_days TEXT;                     -- JSON array for custom: [1,3,5] = Mon/Wed/Fri
```

---

## 5. Algorithm Specifications

### 5.1 Mood-Activity Correlation Analysis

```python
def calculate_influence_on_mood(user_id: int, start_date: str, end_date: str) -> list[dict]:
    """
    Calculate how each activity/tag influences the user's mood.

    Returns list of correlations sorted by impact magnitude:
    [
        {"tag": "Exercise", "delta": +0.8, "sample_size": 45, "confidence": "high"},
        {"tag": "Alcohol", "delta": -0.5, "sample_size": 12, "confidence": "medium"},
        ...
    ]
    """
    # Step 1: Calculate global baseline
    all_entries = get_entries_in_range(user_id, start_date, end_date)
    if len(all_entries) == 0:
        return []

    global_avg = sum(e.mood for e in all_entries) / len(all_entries)

    # Step 2: Calculate per-tag conditional averages
    correlations = []
    all_tags = get_user_tags(user_id)

    for tag in all_tags:
        entries_with_tag = [e for e in all_entries if tag.id in e.tag_ids]
        n = len(entries_with_tag)

        # Require minimum sample size for statistical relevance
        if n < 3:
            continue

        tag_avg = sum(e.mood for e in entries_with_tag) / n
        delta = tag_avg - global_avg

        # Determine confidence level
        if n >= 20:
            confidence = "high"
        elif n >= 10:
            confidence = "medium"
        else:
            confidence = "low"

        correlations.append({
            "tag_id": tag.id,
            "tag_name": tag.name,
            "tag_icon": tag.icon,
            "delta": round(delta, 2),
            "sample_size": n,
            "average_mood": round(tag_avg, 2),
            "confidence": confidence
        })

    # Sort by absolute impact
    correlations.sort(key=lambda x: abs(x["delta"]), reverse=True)

    return correlations
```

### 5.2 Tag Co-occurrence (Apriori-lite)

```python
from collections import Counter
from itertools import combinations

def find_tag_cooccurrences(user_id: int, min_support: int = 5) -> list[dict]:
    """
    Find tags that frequently appear together in entries.

    Returns:
    [
        {"tags": ["Coffee", "Anxiety"], "count": 23, "lift": 2.1},
        {"tags": ["Exercise", "Good Sleep"], "count": 18, "lift": 1.8},
        ...
    ]
    """
    entries = get_all_entries(user_id)
    total_entries = len(entries)

    # Count individual tag frequencies
    tag_counts = Counter()
    for entry in entries:
        for tag_id in entry.tag_ids:
            tag_counts[tag_id] += 1

    # Count pair frequencies
    pair_counts = Counter()
    for entry in entries:
        if len(entry.tag_ids) >= 2:
            for pair in combinations(sorted(entry.tag_ids), 2):
                pair_counts[pair] += 1

    # Filter by minimum support and calculate lift
    cooccurrences = []
    for (tag_a, tag_b), count in pair_counts.items():
        if count >= min_support:
            # Lift = P(A,B) / (P(A) * P(B))
            p_a = tag_counts[tag_a] / total_entries
            p_b = tag_counts[tag_b] / total_entries
            p_ab = count / total_entries
            lift = p_ab / (p_a * p_b) if p_a > 0 and p_b > 0 else 0

            tag_a_name = get_tag_name(tag_a)
            tag_b_name = get_tag_name(tag_b)

            cooccurrences.append({
                "tags": [tag_a_name, tag_b_name],
                "count": count,
                "lift": round(lift, 2)
            })

    # Sort by lift (higher = stronger association)
    cooccurrences.sort(key=lambda x: x["lift"], reverse=True)

    return cooccurrences[:20]  # Top 20
```

### 5.3 Temporal Mood Patterns

```python
def analyze_temporal_patterns(user_id: int, days: int = 90) -> dict:
    """
    Analyze mood patterns by day of week and time of day.
    """
    entries = get_recent_entries(user_id, days)

    # Day of week analysis (0=Monday, 6=Sunday)
    day_moods = {i: [] for i in range(7)}
    for entry in entries:
        dow = entry.created_at.weekday()
        day_moods[dow].append(entry.mood)

    day_averages = {
        i: sum(moods)/len(moods) if moods else None
        for i, moods in day_moods.items()
    }

    best_day = max(day_averages, key=lambda k: day_averages[k] or 0)
    worst_day = min(day_averages, key=lambda k: day_averages[k] or float('inf'))

    # Time of day analysis
    time_buckets = {
        "morning": (5, 12),    # 5am-12pm
        "afternoon": (12, 17), # 12pm-5pm
        "evening": (17, 21),   # 5pm-9pm
        "night": (21, 5)       # 9pm-5am
    }

    time_moods = {bucket: [] for bucket in time_buckets}
    for entry in entries:
        hour = entry.created_at.hour
        for bucket, (start, end) in time_buckets.items():
            if start <= hour < end or (bucket == "night" and (hour >= 21 or hour < 5)):
                time_moods[bucket].append(entry.mood)
                break

    time_averages = {
        bucket: sum(moods)/len(moods) if moods else None
        for bucket, moods in time_moods.items()
    }

    return {
        "day_of_week": {
            "averages": day_averages,
            "best_day": best_day,
            "worst_day": worst_day,
            "day_names": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        },
        "time_of_day": time_averages,
        "insights": generate_insights(day_averages, time_averages)
    }
```

---

## 6. File Structure Guide

```
twilightio/
├── backend/
│   ├── app.py                    # Flask app entry
│   ├── routes/
│   │   ├── entries.py            # CRUD for mood entries
│   │   ├── import.py             # NEW: Daylio import endpoint
│   │   ├── export.py             # NEW: PDF/CSV/JSON export
│   │   ├── media.py              # NEW: Photo/audio upload
│   │   ├── reminders.py          # NEW: Push notification management
│   │   └── analytics.py          # NEW: Correlation/pattern endpoints
│   ├── services/
│   │   ├── scheduler.py          # NEW: Background job scheduler
│   │   ├── pdf_export.py         # NEW: WeasyPrint PDF generation
│   │   ├── analytics.py          # NEW: Correlation calculations
│   │   └── push.py               # NEW: Web Push service
│   ├── templates/
│   │   └── pdf_report.html       # NEW: Jinja2 PDF template
│   └── database_*.py             # Database mixins
│
├── frontend/
│   ├── public/
│   │   ├── sw.js                 # NEW: Service Worker
│   │   └── manifest.json         # UPDATE: PWA manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── YearInPixels.tsx  # NEW
│   │   │   ├── PhotoPicker.tsx   # NEW
│   │   │   ├── VoiceRecorder.tsx # NEW
│   │   │   ├── LockScreen.tsx    # NEW
│   │   │   ├── SearchModal.tsx   # NEW
│   │   │   └── ScaleSlider.tsx   # NEW
│   │   ├── pages/
│   │   │   └── Settings/
│   │   │       ├── Import.tsx    # NEW
│   │   │       ├── Reminders.tsx # NEW
│   │   │       └── Security.tsx  # NEW
│   │   ├── services/
│   │   │   ├── offlineStorage.ts # NEW: IndexedDB layer
│   │   │   └── pushManager.ts    # NEW: Push subscription
│   │   ├── hooks/
│   │   │   └── useInactivityLock.ts  # NEW
│   │   └── styles/
│   │       └── themes.css        # NEW: CSS variable themes
│
├── data/
│   ├── twilightio.db               # SQLite database
│   └── media/                    # NEW: Uploaded files
│
└── docker-compose.yml            # UPDATE: Add media volume
```

---

## 7. Library Dependencies

### Backend (Python)

```txt
# requirements.txt additions
weasyprint>=60.0        # PDF generation
apscheduler>=3.10       # Background job scheduling
pywebpush>=1.14         # Web Push notifications
pillow>=10.0            # Image processing (thumbnails)
```

### Frontend (npm)

```json
{
  "dependencies": {
    "browser-image-compression": "^2.0.2",
    "html2canvas": "^1.4.1",
    "idb": "^8.0.0",
    "workbox-window": "^7.0.0"
  },
  "devDependencies": {
    "workbox-webpack-plugin": "^7.0.0"
  }
}
```

---

## 8. Exhaustive Feature Gap Matrix

### Legend
- ✅ = Implemented
- ⚠️ = Partial
- ❌ = Missing
- 🎯 = Priority target

| Category | Feature | Daylio | Twilightio | Priority |
|----------|---------|--------|----------|----------|
| **IMPORT/EXPORT** | | | | |
| | Import .daylio backups | N/A | ❌ | 🎯 CRITICAL |
| | Export to PDF | ✅ | ❌ | HIGH |
| | Export to CSV (full) | ✅ | ⚠️ | MEDIUM |
| | Export to JSON | ❌ | ❌ | MEDIUM |
| | Cloud backup (GDrive/iCloud) | ✅ | ❌ | HIGH |
| **OFFLINE/PWA** | | | | |
| | Offline entry creation | ✅ | ✅ | 🎯 CRITICAL |
| | Background sync | ✅ | ✅ | 🎯 CRITICAL |
| | Add to Home Screen | ✅ | ✅ | HIGH |
| | Service Worker caching | ✅ | ✅ | HIGH |
| **NOTIFICATIONS** | | | | |
| | Push notifications | ✅ | ✅ | 🎯 CRITICAL |
| | Multiple daily reminders | ✅ | ✅ | HIGH |
| | Custom reminder text | ✅ | ❌ | MEDIUM |
| | Goal reminders | ✅ | ❌ | MEDIUM |
| **SECURITY** | | | | |
| | PIN lock | ✅ | ❌ | HIGH |
| | Biometric (Face/Touch ID) | ✅ | ❌ | HIGH |
| | Auto-lock timeout | ✅ | ❌ | MEDIUM |
| | Encrypted storage | ✅ | ❌ | LOW |
| **MEDIA** | | | | |
| | Photo attachments (3/entry) | ✅ | ✅ | 🎯 CRITICAL |
| | Voice memos | ✅ | ❌ | MEDIUM |
| | Camera capture | ✅ | ❌ | MEDIUM |
| **ANALYTICS** | | | | |
| | Year in Pixels | ✅ | ✅ | 🎯 CRITICAL |
| | Influence on Mood (correlations) | ✅ | ✅ | HIGH |
| | Tag co-occurrence | ✅ | ✅ | MEDIUM |
| | Day of week patterns | ✅ | ❌ | MEDIUM |
| | Time of day patterns | ✅ | ❌ | LOW |
| | Mood stability/variance | ✅ | ❌ | LOW |
| **CUSTOMIZATION** | | | | |
| | Custom mood names | ✅ | ❌ | HIGH |
| | Custom mood emojis | ✅ | ❌ | HIGH |
| | Custom mood colors | ✅ | ❌ | MEDIUM |
| | Multiple color themes | ✅ | ❌ | MEDIUM |
| | Note templates | ✅ | ❌ | MEDIUM |
| **SCALES** | | | | |
| | Custom slider scales | ✅ | ❌ | HIGH |
| | Sleep tracking scale | ✅ | ❌ | HIGH |
| | Energy tracking scale | ✅ | ❌ | HIGH |
| | Stress tracking scale | ✅ | ❌ | HIGH |
| **GOALS** | | | | |
| | Weekly goals (X times/week) | ✅ | ✅ | HIGH |
| | Monthly goals | ✅ | ✅ | LOW |
| | Custom day selection | ✅ | ❌ | MEDIUM |
| **SEARCH** | | | | |
| | Full-text search | ✅ | ✅ | HIGH |
| | Filter by mood | ✅ | ✅ | MEDIUM |
| | Filter by date range | ✅ | ✅ | LOW |
| | Filter by tags | ✅ | ✅ | MEDIUM |
| **GAMIFICATION** | | | | |
| | More achievements | ✅ | ⚠️ | LOW |
| | Secret achievements | ✅ | ❌ | LOW |
| | Achievement categories | ✅ | ❌ | LOW |
| **NEW FEATURES** | | | | |
| | Important Days (Countdowns) | ✅ | ❌ | 🎯 HIGH |
| | Global Photo Gallery | ✅ | ❌ | MEDIUM |
| | Home Screen Widgets | ✅ | ❌ | LOW (PWA limitation) |
| | Mood Stability Metric | ✅ | ❌ | MEDIUM |
| **UX ENHANCEMENTS** | | | | |
| | Smart FAB (context-aware) | ✅ | ❌ | MEDIUM |
| | Enhanced Streak Visualizer | ✅ | ⚠️ | MEDIUM |
| | Card-based activity groups | ✅ | ❌ | MEDIUM |
| | Calendar empty state actions | ✅ | ❌ | LOW |
| | OLED Black theme | ✅ | ❌ | LOW |
| | Often Together enhancement | ✅ | ⚠️ | LOW |

---

## 9. Twilightio Advantages (Preserve These)

| Advantage | Description |
|-----------|-------------|
| **100% Free** | No premium tier, no paywalls, no ads |
| **Self-Hosted** | Complete data ownership |
| **Open Source** | AGPL-3.0 license |
| **Rich Markdown** | Full MDXEditor with formatting |
| **Multi-User** | Family/group instances |
| **Docker Deploy** | `docker compose up` |
| **Cross-Platform** | Any device with a browser |
| **No Tracking** | Zero telemetry |
| **API Access** | RESTful for integrations |

---

## 10. References

- [Daylio Official Website](https://daylio.net/)
- [Daylio Knowledge Base](https://daylio.net/faq/docs/daylio-faq/)
- [Twilightio GitHub](https://github.com/shirsakm/twilightio)
- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/rfc8030)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
