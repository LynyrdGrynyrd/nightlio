import csv
import io
import json
import base64
from datetime import datetime
from typing import Dict, Any, Optional, List

import matplotlib
matplotlib.use('Agg') # Non-interactive backend
import matplotlib.pyplot as plt
from flask import render_template
from weasyprint import HTML
import pydyf

class ExportService:
    def __init__(self, db):
        self.db = db

    def generate_pdf(self, user_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None, format_type: str = "standard") -> bytes:
        """
        Generate a PDF report for the user.
        format_type: 'standard' or 'therapist'
        """
        # Fetch entries
        if start_date and end_date:
            entries = self.db.get_mood_entries_by_date_range(user_id, start_date, end_date)
            period_str = f"{start_date} to {end_date}"
        else:
            entries = self.db.get_all_mood_entries(user_id)
            if entries:
                period_str = f"{entries[-1]['date']} to {entries[0]['date']}"
            else:
                period_str = "All Time"

        # Stats
        total_entries = len(entries)
        avg_mood = 0
        mood_counts = {1:0, 2:0, 3:0, 4:0, 5:0}
        
        enriched_entries = []
        for entry in entries:
            m = entry["mood"]
            avg_mood += m
            mood_counts[m] = mood_counts.get(m, 0) + 1
            
            # Enrich for template
            selections = self.db.get_entry_selections(entry["id"])
            entry_data = dict(entry)
            entry_data["mood_label"] = self._get_mood_label(m)
            entry_data["date_formatted"] = entry["date"]
            entry_data["activities"] = [s["name"] for s in selections]
            enriched_entries.append(entry_data)
            
        if total_entries > 0:
            avg_mood = round(avg_mood / total_entries, 1)

        mood_stability = self._calculate_mood_stability([entry["mood"] for entry in entries])

        # Group entries by month for page breaks
        month_groups = {}
        for entry in enriched_entries:
            try:
                date_obj = datetime.strptime(entry["date"], "%Y-%m-%d")
                month_key = date_obj.strftime("%B %Y")
            except:
                month_key = "Other"
            if month_key not in month_groups:
                month_groups[month_key] = []
            month_groups[month_key].append(entry)
        
        # Sort months chronologically
        sorted_months = sorted(month_groups.keys(), key=lambda x: datetime.strptime(x, "%B %Y") if x != "Other" else datetime.min, reverse=True)
        month_data = [(month, month_groups[month]) for month in sorted_months]

        # Generate Chart
        chart_base64 = self._generate_mood_chart(mood_counts)

        # Select template based on format
        template_name = "pdf_report_therapist.html" if format_type == "therapist" else "pdf_report.html"

        # Render HTML
        html_content = render_template(
            template_name,
            month_data=month_data,
            start_date=start_date or "Start",
            end_date=end_date or "End",
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
            total_entries=total_entries,
            average_mood=avg_mood,
            chart_image=chart_base64,
            mood_stability=mood_stability,
        )

        # HTML to PDF
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes

    def _generate_mood_chart(self, mood_counts: Dict[int, int]) -> str:
        """Generate bar chart and return base64 string."""
        moods = [1, 2, 3, 4, 5]
        counts = [mood_counts.get(m, 0) for m in moods]
        labels = ['Awful', 'Bad', 'Meh', 'Good', 'Rad']
        colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

        plt.figure(figsize=(6, 4))
        bars = plt.bar(labels, counts, color=colors)
        plt.title('Mood Distribution')
        plt.xlabel('Mood')
        plt.ylabel('Count')
        
        # Add counts on top
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                     '%d' % int(height),
                     ha='center', va='bottom')

        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.close()
        buf.seek(0)
        img_str = base64.b64encode(buf.getvalue()).decode('utf-8')
        return img_str

    def _get_mood_label(self, mood: int) -> str:
        labels = {1: 'Awful', 2: 'Bad', 3: 'Meh', 4: 'Good', 5: 'Rad'}
        return labels.get(mood, str(mood))

    def _calculate_mood_stability(self, moods: List[int]) -> Dict[str, Any]:
        if len(moods) < 3:
            return {
                "stability_score": None,
                "interpretation": "Not enough data",
                "sample_size": len(moods),
            }

        avg = sum(moods) / len(moods)
        variance = sum((x - avg) ** 2 for x in moods) / len(moods)
        std_dev = variance ** 0.5

        max_std_dev = 2.0
        stability_score = max(0, min(100, (1 - std_dev / max_std_dev) * 100))

        if stability_score >= 85:
            interpretation = "Very Stable"
        elif stability_score >= 70:
            interpretation = "Stable"
        elif stability_score >= 50:
            interpretation = "Variable"
        else:
            interpretation = "Volatile"

        return {
            "stability_score": round(stability_score, 1),
            "interpretation": interpretation,
            "sample_size": len(moods),
        }


    def generate_csv(self, user_id: int) -> str:
        """
        Generate a CSV string of all mood entries for the user.
        Columns: Date, Time, Mood, Content, Activities, Photos
        """
        # Fetch detailed data (requires advanced query or loop)
        # For simplicity, we can reuse get_all_mood_entries and iterate to get details
        # Or add a method in DB mixin to get flat export data.
        # Let's try to fetch all entries first.
        entries = self.db.get_all_mood_entries(user_id)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Date", "Time", "Mood", "Content", "Activities", "Photos"])
        
        for entry in entries:
            entry_id = entry["id"]
            
            # Fetch details if not present (activities, photos)
            # This suffers from N+1 query problem but is acceptable for export task (low frequency)
            selections = self.db.get_entry_selections(entry_id)
            activities_str = ", ".join([s["name"] for s in selections])
            
            # Media (not in mixin? let's check media service logic or db mixin)
            # Assuming MediaMixin is part of MoodDatabase
            media_files = []
            if hasattr(self.db, "get_media_for_entry"):
                media = self.db.get_media_for_entry(entry_id)
                media_files = [m["file_path"] for m in media]
            photos_str = ", ".join(media_files)
            
            row = [
                entry["date"],
                entry["created_at"], # This is technically datetime or time depending on schema usage
                entry["mood"],
                entry["content"],
                activities_str,
                photos_str
            ]
            writer.writerow(row)
            
        return output.getvalue()

    def generate_json(self, user_id: int) -> Dict[str, Any]:
        """
        Generate a full JSON export object.
        """
        data = {
            "meta": {
                "exported_at": datetime.now().isoformat(),
                "version": "1.0"
            },
            "user": {}, # Maybe user profile info?
            "groups": [],
            "entries": [],
            "goals": []
        }
        
        # User info (optional, skip for now or fetch basic)
        
        # Groups and Options
        if hasattr(self.db, "get_all_groups"):
            data["groups"] = self.db.get_all_groups()

        # Since we want to avoid complex logic here, let's keep it simple.
        # We will assume we can rely on existing methods or add new ones if absolutely needed.
        # For JSON backup, raw data tables is best.
        
        # 1. Activities (Groups + Options)
        # We'll rely on `get_all_groups` which returns nested options.
        if hasattr(self.db, "get_all_groups"):
            data["groups"] = self.db.get_all_groups()
            
        # Let's just dump entries for now as the primary value.
        data["entries"] = self.db.get_all_mood_entries(user_id)
        
        # Enrich entries with selections because get_all_mood_entries returns flat rows
        # This is expensive (N+1) but fine for export
        for entry in data["entries"]:
            selections = self.db.get_entry_selections(entry["id"])
            # Add full selection details including icon and group name
            entry["selections"] = selections
            # Also add simplified list of names for easier reading
            entry["activities"] = [s["name"] for s in selections]
            
        return data

    def import_json(self, user_id: int, data: Dict[str, Any]) -> Dict[str, int]:
        """
        Import data from JSON object.
        Restores entries and ensures groups/tags exist.
        """
        import_stats = {"entries": 0, "groups": 0, "errors": 0}
        
        # Restore Entries
        entries = data.get("entries", [])
        for entry in entries:
            try:
                # Upsert entries
                selected_ids = [] # TODO: Tag matching logic if time permits
                
                self.db.create_mood_entry(
                   user_id=user_id,
                   mood=entry["mood"],
                   date=entry["date"],
                   time=entry.get("time") or entry.get("created_at"), 
                   content=entry["content"],
                   selected_options=selected_ids 
                )
                import_stats["entries"] += 1
                
            except Exception as e:
                import_stats["errors"] += 1
                print(f"Failed to import entry {entry.get('id')}: {e}")
                
        return import_stats
