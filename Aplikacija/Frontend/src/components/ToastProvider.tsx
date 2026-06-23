import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';

interface Toast {
    id: number;
    message: string;
    severity: AlertColor;
}

interface ToastContextType {
    showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } });

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, severity }]);
    }, []);

    const handleClose = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toasts.map((toast, index) => (
                <Snackbar
                    key={toast.id}
                    open
                    autoHideDuration={4000}
                    onClose={() => handleClose(toast.id)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    sx={{ mb: index * 7 }}
                >
                    <Alert
                        onClose={() => handleClose(toast.id)}
                        severity={toast.severity}
                        variant="filled"
                        sx={{ width: '100%', minWidth: 280, maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: 2 }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>
            ))}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
