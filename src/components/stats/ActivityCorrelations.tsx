import { CSSProperties } from 'react';
import { getIconComponent } from '../ui/IconPicker';

interface Activity {
  id: number;
  name: string;
  icon: string;
  count: number;
  average_mood: string;
  impact_score: number;
}

interface ActivityCorrelationsData {
  activities: Activity[];
  overall_average: number;
}

interface ActivityCorrelationsProps {
  data: ActivityCorrelationsData | null;
}

const ActivityCorrelations = ({ data }: ActivityCorrelationsProps) => {
  if (!data || !data.activities || data.activities.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
        Not enough data to calculate impact yet.
      </div>
    );
  }

  const { activities, overall_average } = data;

  const cardStyle: CSSProperties = {
    padding: '0px'
  };

  const headerStyle: CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid var(--border)'
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: '1.2rem'
  };

  const subtitleStyle: CSSProperties = {
    margin: '4px 0 0',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem'
  };

  const activityStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)'
  };

  const activityInfoStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const iconContainerStyle: CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--surface-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text)'
  };

  const activityNameStyle: CSSProperties = {
    fontWeight: 600
  };

  const activityStatsStyle: CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  };

  return (
    <div className="card" style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Influence on Mood</h3>
        <p style={subtitleStyle}>
          How activities affect your average ({overall_average.toFixed(2)})
        </p>
      </div>

      <div className="list-container">
        {activities.map((activity) => {
          const Icon = getIconComponent(activity.icon);
          const impact = activity.impact_score;
          const isPositive = impact > 0;

          let color = 'var(--text-secondary)';
          if (isPositive) color = 'var(--success, var(--mood-5))';
          if (impact < 0) color = 'var(--danger, var(--mood-1))';

          const impactStyle: CSSProperties = {
            fontWeight: 700,
            color: color,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          };

          return (
            <div key={activity.id} style={activityStyle}>
              <div style={activityInfoStyle}>
                <div style={iconContainerStyle}>
                  {Icon && <Icon size={18} />}
                </div>
                <div>
                  <div style={activityNameStyle}>{activity.name}</div>
                  <div style={activityStatsStyle}>
                    {activity.count} entries • Avg: {activity.average_mood}
                  </div>
                </div>
              </div>

              <div style={impactStyle}>
                {impact > 0 ? '+' : ''}{impact}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityCorrelations;
