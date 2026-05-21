import React, { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import TeamLeaderDashboard from "./pages/TeamLeaderDashboard";
import SubscriptionBlockedScreen from "./pages/SubscriptionBlockedScreen";

function App() {
    const [currentRoute, setCurrentRoute] = useState(window.location.pathname.replace(/\/$/, ""));
    const [isBlocked, setIsBlocked] = useState(localStorage.getItem('subscription_blocked') === 'true');

    useEffect(() => {
        const handleLocationChange = () => {
            setCurrentRoute(window.location.pathname.replace(/\/$/, ""));
        };
        
        const handleSubscriptionBlocked = () => {
            localStorage.setItem('subscription_blocked', 'true');
            setIsBlocked(true);
        };

        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('subscription-blocked', handleSubscriptionBlocked);
        
        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('subscription-blocked', handleSubscriptionBlocked);
        };
    }, []);

    // routing
    const renderRoute = () => {
        const path = currentRoute || "/";
        const role = localStorage.getItem('role');
        const isExempt = role === 'admin' || role === 'super_admin';

        if (isBlocked && !isExempt && path !== '/login' && path !== '/') {
            return <SubscriptionBlockedScreen onRestore={() => setIsBlocked(false)} />;
        }
        
        if (path === '/admin') return <AdminDashboard />;
        if (path === '/employee') return <EmployeeDashboard />;
        if (path === '/manager') return <ManagerDashboard />;
        if (path === '/team-leader') return <TeamLeaderDashboard />;
        if (path === '/login') return <LoginPage />;
        
        return <LandingPage />;
    };

    return (
        <div>
            {renderRoute()}
        </div>
    );
}

export default App;