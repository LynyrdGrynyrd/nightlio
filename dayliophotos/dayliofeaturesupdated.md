# Daylio vs Nightlio: Visual Gap Analysis & Enhancement Plan

Based on a detailed visual inspection of the Daylio screenshots (Jan 10, 2026), the following features and UX refinements are recommended to elevate Nightlio to a "10/10" experience.

## 1. New Core Features (Missing from current Roadmap)

### 1.1 "Important Days" (Countdowns)
**Observation:** A dedicated feature to track significant dates (Birthdays, Anniversaries, Vacations) with countdowns and reminders.
**Screenshots:** `Screenshot_...163328.png`
**Requirement:**
- New Database Table: `important_days` (id, title, date, icon, category, recurring_type).
- UI: Card view with countdown (e.g., "in 5 days").
- Integration: "New Important Day" option in the main FAB (Floating Action Button).

### 1.2 "Mood Stability" Metric
**Observation:** A specific metric (0-100 score) displayed on the dashboard with a trend line.
**Screenshots:** `Screenshot_...163314.png`
**Requirement:**
- Algorithm: Calculate standard deviation of mood scores over a rolling window (e.g., 30 days) and map to a 0-100 scale (Lower deviation = Higher stability).
- UI: Dedicated card on Stats page.

### 1.3 Global Photo Gallery
**Observation:** A "Photo Gallery" menu item implies a centralized view of all uploaded photos, independent of the entry they belong to.
**Screenshots:** `Screenshot_...163338.png`
**Requirement:**
- New Page: `/gallery`
- UI: Grid view of all photos, sorted by date. Clicking opens the associated entry.

---

## 2. UX & UI Polish (The "10/10" Details)

### 2.1 Activity Group Management (Drastically Improved)
**Observation:** The "Edit Activities" screen is highly visual and interactive.
**Screenshots:** `Screenshot_...163204.png`, `163211.png`
**Enhancements:**
- **Card-based Groups:** Each category (Emotions, Sleep, Hobbies) should be a distinct card with its own edit controls.
- **"Move Here" Action:** Allow moving activities between groups easily.
- **Group Colors:** Each group has a unique color identifier.
- **Grid/List Toggle:** Allow users to view activities as a grid of circles or a vertical list.
- **"Add Group or Scale" Button:** clear call-to-action at the bottom.

### 2.2 Dashboard "Streak" Visualizer
**Observation:** A "Days in a Row" section at the top of the dashboard.
**Screenshots:** `Screenshot_...163243.png`
**Enhancements:**
- Visual chain: Circles for previous 4 days + "Today".
- Status indicators: `+` (empty), `✔` (logged).
- "Longest Chain" stat displayed immediately below.

### 2.3 Calendar Interactions
**Observation:** The calendar view is more than just read-only.
**Screenshots:** `Screenshot_...163318.png`
**Enhancements:**
- **Empty State Actions:** Days without entries display a faint `+` button in the cell, encouraging back-filling.
- **Mood Filters:** "emoji 1x" dropdown to filter the calendar view by specific moods.

### 2.4 Smart FAB (Floating Action Button)
**Observation:** The main `+` button offers context-aware quick actions.
**Screenshots:** `Screenshot_...163338.png`
**Enhancements:**
- On Dashboard: Expands to "Yesterday", "Today", "Other day" for rapid logging.
- On Stats/More: Expands to "New Goal", "New Important Day".

### 2.5 "Often Together" Visualization
**Observation:** A specific layout for correlations.
**Screenshots:** `Screenshot_...163323.png`
**Enhancements:**
- Dropdown to select the "trigger" mood/activity (e.g., "bad (1x)").
- Horizontal list of associated activities with count badges.
- Text: "You often do this: [Activity List]".

---

## 3. Visual Styling Checklist

- [ ] **Mood Icons:** Ensure we have a set of "Solid" vs "Outline" icons to represent selected vs unselected states.
- [ ] **Activity Icons:** Circular buttons with icons inside. When selected, the circle fills with the group's color.
- [ ] **Dark Mode defaults:** The screenshots are all in Dark Mode with high contrast (Black background, bright accent colors). Ensure Nightlio's dark theme matches this "OLED Black" aesthetic rather than just dark grey.
- [ ] **Celebratory Text:** "This has been your first entry. Now let's make some history!" (Add detailed empty states).

## 4. Proposed Database Updates

```sql
CREATE TABLE important_days (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,          -- YYYY-MM-DD
    icon TEXT,
    category TEXT,               -- 'Birthday', 'Holiday', etc.
    remind_days_before INTEGER,  -- 0 = on day, 1 = 1 day before
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Immediate Next Steps for Developer

1.  **Refactor "Edit Activities"**: Move from a simple list to the Card/Group based UI seen in screenshots.
2.  **Implement "Important Days"**: This is a low-hanging fruit feature that adds significant value.
3.  **Update Dashboard**: Add the "Streak" visualizer as the very first element.
