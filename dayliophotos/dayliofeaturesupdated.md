Below is the **Comprehensive Feature Specification & UX Analysis** for your Nightlio fork. I have structured this as a **Product Requirements Document (PRD)** so you can directly map these to GitHub Issues.

---

# 📱 Daylio Clone: Master Feature Specification

### **1. Core Journaling Engine (The "Input" Layer)**

*The foundational layer. Nightlio has the basics, but lacks the taxonomy and rich media.*

* **Hierarchical Activity Taxonomy:**
* **Groups:** Activities must be nested inside Groups (e.g., "Food" contains "Pizza", "Vegan").
* **Management:** Users must be able to Create, Rename, Delete, and **Reorder** both Groups and Activities.
* **Visuals:** Each Activity has a dedicated icon; Each Group has a color code.


* **Rich Media Attachments:**
* **Photo Upload:** 1+ photos per entry. (Requires a dedicated "Gallery" view later).
* **Voice Memos:** Audio recording attached to the entry.


* **Structured Metadata:**
* **Time of Day:** timestamp is critical (not just date).
* **Notes:** Text area with Markdown support (Nightlio has this, but Daylio adds "Writing Templates" to prompt the user).



### **2. Intelligence & Analytics (The "Value" Layer)**

*This is the strongest competitive advantage. These features turn raw data into insights.*

* **The "Correlation Engine" (Highest Priority):**
* **"Often Together":** Queries the DB to find which Activities appear most frequently with specific Moods (e.g., "When you feel **Bad**, you often **Sleep Late**").


* **Mood Metrics:**
* **Average Daily Mood:** A weighted average of all entries in a single day.
* **Mood Stability Score:** A calculated metric (0–100) based on the standard deviation of mood ratings over the last 30 days. High deviation = Low score.


* **Visualizations:**
* **Monthly Mood Grid:** A Github-contribution-style calendar where every day is a colored dot representing the average mood.
* **Line Charts:** Mood evolution over time.
* **Activity Counts:** Bar charts showing how many times a user clicked specific tags.



### **3. Gamification & Retention (The "Sticky" Layer)**

*Features designed to build a daily habit.*

* **Achievement System:**
* Logic triggers that award badges (e.g., "3 Day Streak", "First 10 Entries", "Night Owl").
* *Implementation:* A background check that runs `on_save()` of every entry.


* **Goal Tracking:**
* Users define binary goals (e.g., "Drink Water") or frequency goals (e.g., "Exercise 3x/week").
* The app checks entry tags against these goals and displays a "Success" UI.


* **"Important Days" Widget:**
* A countdown timer for future events (Birthdays, Holidays, Trips).
* *UX:* Adds a positive, forward-looking element to a typically retrospective app.



### **4. System, Security & Data Sovereignty**

* **Privacy Guard:**
* **PIN/Biometric Lock:** An overlay that activates when the app loses focus for >1 minute.


* **Data Portability:**
* **Export:** CSV (raw data) and PDF (visual report).
* **Backup:** Cloud sync (Google Drive/Dropbox) or Local File Download (`.db` or `.zip`).


* **Theming:**
* **Color Sets:** The ability to swap the primary accent color (Teal, Orange, Blue) which cascades across all buttons and charts.



---

# 🎨 User Experience (UX) & Interface Guide

### **A. The "Entry" Flow (Micro-interactions)**

1. **Mood First:** The user is *always* asked "How are you?" (5-point scale) before anything else. This anchors the entry.
2. **Scroll-to-Save:** The activity list is long. The "Save" button is often floating or at the bottom, but the interaction encourages reviewing the whole day.
3. **Default to "Today":** The UI assumes you are logging for *now*, but allows changing the date/time easily.

### **B. The "Timeline" View (The Home Screen)**

* **Card-Based Layout:** Each entry is a distinct "Card".
* **Header:** Large Mood Icon + Date + Time.
* **Body:** List of Activity Icons (inline) + Text Snippet.
* **Footer:** Edit/Delete context menu (usually hidden behind a "..." dots menu).


* **Empty State Handling:** When no entries exist for the day, show "prompts" buttons (e.g., "New Goal", "New Important Day") to encourage setup.

### **C. Navigation Structure**

Daylio uses a **Bottom Tab Bar** (The standard for mobile apps, but Nightlio might be using a side drawer).

1. **Entries (Home):** The timeline stream.
2. **Stats:** The dashboard of charts.
3. **(+) FAB (Floating Action Button):** The primary call-to-action to log a mood. It sits centrally and overlaps the tab bar.
4. **Calendar:** The pixel-grid view.
5. **More:** Settings, Goals, Achievements.

---

# 🏗 Database Schema: The "Forking" Plan

To support these features, you will need to migrate Nightlio's likely simple schema to a relational one. Here is the SQL structure you need to build:

```sql
-- 1. The Taxonomy (Missing in Nightlio)
CREATE TABLE activity_groups (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,         -- e.g., "Hobbies"
    color_hex TEXT,             -- e.g., "#FF5733"
    sort_order INTEGER          -- For custom ordering
);

CREATE TABLE activities (
    id INTEGER PRIMARY KEY,
    group_id INTEGER,           -- Link to Parent Group
    name TEXT NOT NULL,         -- e.g., "Gaming"
    icon_id TEXT,               -- Reference to an icon set
    is_archived BOOLEAN DEFAULT 0,
    FOREIGN KEY(group_id) REFERENCES activity_groups(id)
);

-- 2. Richer Entries
CREATE TABLE entries (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    timestamp DATETIME,         -- Daylio tracks specific time, not just date
    mood_score INTEGER,         -- 1 to 5
    note_content TEXT,          -- Markdown
    location_lat REAL,          -- (Optional future proofing)
    location_long REAL
);

-- 3. The Links (Many-to-Many)
CREATE TABLE entry_activities (
    entry_id INTEGER,
    activity_id INTEGER,
    PRIMARY KEY (entry_id, activity_id)
);

-- 4. Assets (For Photos/Voice)
CREATE TABLE entry_assets (
    id INTEGER PRIMARY KEY,
    entry_id INTEGER,
    type TEXT,                  -- 'PHOTO' or 'VOICE'
    file_path TEXT,             -- Local path or S3 URL
    created_at DATETIME
);

-- 5. Gamification
CREATE TABLE goals (
    id INTEGER PRIMARY KEY,
    activity_id INTEGER,        -- The activity to track
    target_frequency INTEGER,   -- e.g., 3 (times)
    period TEXT                 -- 'WEEKLY' or 'MONTHLY'
);

```

### **Where to start?**

If I were you, I would ignore the "Gamification" (Badges/Goals) for now. The **"Activity Groups"** and **"Correlation Stats"** are the features that make Daylio feel "smart." Nightlio feels "dumb" without them.

**Would you like me to write the Python/SQL query for the "Often Together" correlation engine?** That is the trickiest logic to get right.