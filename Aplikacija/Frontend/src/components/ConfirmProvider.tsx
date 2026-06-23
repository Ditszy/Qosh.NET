import React, { createContext, useContext, useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ConfirmState {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    severity: 'warning' | 'error';
    resolve: (value: boolean) => void;
}

interface ConfirmContextType {
    confirm: (options: {
        title?: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        severity?: 'warning' | 'error';
    }) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: async () => false });

let defaultResolve: (value: boolean) => void = () => {};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ConfirmState>({
        open: false,
        title: '',
        message: '',
        confirmText: 'Potvrdi',
        cancelText: 'Otkaži',
        severity: 'warning',
        resolve: () => {},
    });

    const confirm = useCallback((options: {
        title?: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        severity?: 'warning' | 'error';
    }): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            setState({
                open: true,
                title: options.title || 'Potvrda',
                message: options.message,
                confirmText: options.confirmText || 'Potvrdi',
                cancelText: options.cancelText || 'Otkaži',
                severity: options.severity || 'warning',
                resolve,
            });
            defaultResolve = resolve;
        });
    }, []);

    const handleClose = (result: boolean) => {
        state.resolve(result);
        setState(prev => ({ ...prev, open: false }));
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <Dialog
                open={state.open}
                onClose={() => handleClose(false)}
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { borderRadius: 3, p: 1 }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                    <WarningAmberIcon sx={{
                        color: state.severity === 'error' ? 'error.main' : 'warning.main',
                        fontSize: 28
                    }} />
                    {state.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {state.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={() => handleClose(false)}
                        variant="outlined"
                        sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none' }}
                    >
                        {state.cancelText}
                    </Button>
                    <Button
                        onClick={() => handleClose(true)}
                        variant="contained"
                        color={state.severity === 'error' ? 'error' : 'warning'}
                        sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
                    >
                        {state.confirmText}
                    </Button>
                </DialogActions>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    return useContext(ConfirmContext);
}
