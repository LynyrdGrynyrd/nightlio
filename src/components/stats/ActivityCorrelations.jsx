import { getIconComponent } from '../ui/IconPicker';

const ActivityCorrelations = ({ data }) => {
    if (!data || !data.activities || data.activities.length === 0) {
        return (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                Not enough data to calculate impact yet.
            </div>
        );
    }

    const { activities, overall_average } = data;

    return (
        <div className="card" style={{ padding: '0px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Influence on Mood</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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

                    return (
                        <div key={activity.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 20px',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px', height: '32px',
                                    borderRadius: '8px',
                                    background: 'var(--surface-hover)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text)'
                                }}>
                                    {Icon && <Icon size={18} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{activity.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {activity.count} entries • Avg: {activity.average_mood}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                fontWeight: 700,
                                color: color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
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
