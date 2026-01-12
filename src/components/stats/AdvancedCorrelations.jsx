import { useState, useEffect } from 'react';
import { getIconComponent } from '../ui/IconPicker';
import apiService from '../../services/api';
import './AdvancedCorrelations.css';

const AdvancedCorrelations = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await apiService.getAdvancedCorrelations();
                setData(result);
            } catch (err) {
                console.error('Failed to fetch advanced correlations:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="advanced-stats-loading">Loading advanced insights...</div>;
    }

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="card advanced-correlations">
            <div className="card-header">
                <h3>Hidden Patterns</h3>
                <p>Activities that often happen together (Lift &gt; 1.0)</p>
            </div>

            <div className="correlations-table-container">
                <table className="correlations-table">
                    <thead>
                        <tr>
                            <th>Pair</th>
                            <th>Lift</th>
                            <th>Reliability</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => {
                            const Icon1 = getIconComponent(item.option1_icon);
                            const Icon2 = getIconComponent(item.option2_icon);

                            // Determine strongest direction
                            const conf1to2 = item.confidence_1_to_2;
                            const conf2to1 = item.confidence_2_to_1;
                            const is1to2 = conf1to2 >= conf2to1;
                            const maxConf = Math.max(conf1to2, conf2to1);

                            return (
                                <tr key={idx}>
                                    <td className="pair-cell">
                                        <div className="pair-visual">
                                            <div className="pair-item">
                                                {Icon1 && <Icon1 size={16} />}
                                                <span>{item.option1_name}</span>
                                            </div>
                                            <span className="pair-connector">+</span>
                                            <div className="pair-item">
                                                {Icon2 && <Icon2 size={16} />}
                                                <span>{item.option2_name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="metric-cell">
                                            <span className="metric-value">{item.lift.toFixed(2)}x</span>
                                            <span className="metric-label">{item.lift > 2 ? 'Strong' : 'Moderate'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="metric-cell">
                                            <span className="metric-value">{(maxConf * 100).toFixed(0)}%</span>
                                            <span className="metric-label">
                                                {is1to2 ? `${item.option1_name}→${item.option2_name}` : `${item.option2_name}→${item.option1_name}`}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="card-footer-info">
                <small>Lift {'>'} 1.0 means activities appear together more often than random chance.</small>
            </div>
        </div>
    );
};

export default AdvancedCorrelations;
