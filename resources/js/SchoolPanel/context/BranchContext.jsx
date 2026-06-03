import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
    const { user } = useAuth();
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBranches = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get('school-branches');
            setBranches(res.data);
            
            // Try to restore from localStorage or find default
            const savedBranchId = localStorage.getItem('selectedBranchId');
            let initialBranch = null;
            
            if (savedBranchId) {
                initialBranch = res.data.find(b => b.id == savedBranchId);
            }
            
            if (!initialBranch) {
                // Default to first branch or user's branch
                initialBranch = res.data.find(b => b.id == user.school_branch_id) || res.data[0];
            }
            
            if (initialBranch) {
                handleBranchChange(initialBranch);
            }
        } catch (err) {
            console.error('Failed to fetch branches', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBranchChange = (branch) => {
        setSelectedBranch(branch);
        if (branch) {
            localStorage.setItem('selectedBranchId', branch.id);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBranches();
        }
    }, [user]);

    return (
        <BranchContext.Provider value={{
            branches,
            selectedBranch,
            setSelectedBranch: handleBranchChange,
            refreshBranches: fetchBranches,
            loading,
            isOwner: user?.role === 'owner'
        }}>
            {children}
        </BranchContext.Provider>
    );
};

export const useBranch = () => {
    const context = useContext(BranchContext);
    if (!context) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
};
