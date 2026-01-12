import { createContext, useContext, useEffect, useState } from 'react';
import apiService from '../services/api';

const MoodDefinitionsContext = createContext({
    definitions: {},
    loading: true,
    refreshDefinitions: async () => { },
});

export const MoodDefinitionsProvider = ({ children }) => {
    const [definitions, setDefinitions] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshDefinitions = async () => {
        try {
            const data = await apiService.getMoodDefinitions();
            setDefinitions(data);
        } catch (error) {
            console.error('Failed to load mood definitions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshDefinitions();
    }, []);

    // Update CSS variables when definitions change
    useEffect(() => {
        if (definitions.length > 0) {
            definitions.forEach(def => {
                if (def.score >= 1 && def.score <= 5) {
                    document.documentElement.style.setProperty(`--mood-${def.score}`, def.color_hex);
                }
            });
        }
    }, [definitions]);

    return (
        <MoodDefinitionsContext.Provider value={{ definitions, loading, refreshDefinitions }}>
            {children}
        </MoodDefinitionsContext.Provider>
    );
};

export const useMoodDefinitions = () => useContext(MoodDefinitionsContext);
