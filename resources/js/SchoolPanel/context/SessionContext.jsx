import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const SessionContext = createContext();

import { useBranch } from './BranchContext';

export const SessionProvider = ({ children }) => {
    const { selectedBranch } = useBranch();
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchSessions = async (branchId) => {
        if (!branchId) {
            setSessions([]);
            setSelectedSession(null);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`sessions?branch_id=${branchId}`);
            setSessions(res.data);
            
            // Try to restore from localStorage or find active session
            const savedSessionId = localStorage.getItem('selectedSessionId');
            let initialSession = null;
            
            if (savedSessionId) {
                initialSession = res.data.find(s => s.id == savedSessionId);
            }
            
            if (!initialSession) {
                initialSession = res.data.find(s => s.is_active === 'active') || res.data[0];
            }
            
            if (initialSession) {
                handleSessionChange(initialSession);
            } else {
                setSelectedSession(null);
            }
        } catch (err) {
            console.error('Global Session Fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionChange = (session) => {
        setSelectedSession(session);
        if (session) {
            localStorage.setItem('selectedSessionId', session.id);
        }
    };

    useEffect(() => {
        if (selectedBranch) {
            fetchSessions(selectedBranch.id);
        }
    }, [selectedBranch]);

    return (
        <SessionContext.Provider value={{
            sessions,
            selectedSession,
            setSelectedSession: handleSessionChange,
            refreshSessions: () => fetchSessions(selectedBranch?.id),
            loading
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
