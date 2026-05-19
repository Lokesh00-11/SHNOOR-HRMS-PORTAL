import React, { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import TeamLeaderDashboard from "./pages/TeamLeaderDashboard";

function App() {
    const [currentRoute, setCurrentRoute] = useState(window.location.pathname.replace(/\/$/, ""));

    useEffect(() => {
        const handleLocationChange = () => {
            setCurrentRoute(window.location.pathname.replace(/\/$/, ""));
        };
        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    // routing
    const renderRoute = () => {
        const path = currentRoute || "/";
        
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