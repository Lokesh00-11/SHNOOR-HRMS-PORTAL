import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, post } from '../services/api';

const BadgeContext = createContext();

export const useBadges = () => useContext(BadgeContext);

export const BadgeProvider = ({ children }) => {
    const [badgeCounts, setBadgeCounts] = useState({
        notifications: 0,
        leaves: 0,
        expenses: 0,
        queries: 0,
        tasks: 0,
        payroll: 0,
        thanks: 0,
        offboarding: 0,
        transactions: 0,
    });

    const fetchCounts = async () => {
        try {
            const data = await get('/badges/counts/');
            if (data) {
                setBadgeCounts(data);
            }
        } catch (error) {
            console.error('Failed to fetch badge counts:', error);
        }
    };

    const markAsRead = async (type) => {
        try {
            await post('/badges/mark-read/', { type });
            setBadgeCounts(prev => ({ ...prev, [type]: 0 }));
        } catch (error) {
            console.error(`Failed to mark ${type} as read:`, error);
        }
    };

    useEffect(() => {
        fetchCounts();

        const handleFocus = () => fetchCounts();
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    return (
        <BadgeContext.Provider value={{ badgeCounts, markAsRead, refreshBadges: fetchCounts }}>
            {children}
        </BadgeContext.Provider>
    );
};
