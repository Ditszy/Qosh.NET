import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface RequireRoleProps {
    roles: UserRole[];
    children: ReactElement;
}

export default function RequireRole({ roles, children }: RequireRoleProps) {
    const { isAuthenticated, hasRole, isLoading } = useAuth();

    // Prvo da se ucita auth
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasRole(...roles)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
