import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// UPDATED: Path matches new services directory
import authService from '../services/authService'; 
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, roles }) => {
    const location = useLocation();
    const profile = authService.getProfile();
    const authenticated = authService.isLoggedIn();

    if (!authenticated) { // UPDATED: Redirect to login if no token
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(profile?.role)) { // UPDATED: Role check
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-400 p-8">
                <ShieldAlert size={64} className="mb-4 opacity-20" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Access Denied</h2>
                <p className="text-sm font-medium mt-2">You do not have permission to view this resource.</p>
                <button 
                    onClick={() => window.history.back()}
                    className="mt-6 text-blue-600 font-bold text-xs uppercase tracking-widest"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;