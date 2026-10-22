import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import {
    Snackbar,
    Alert,
    AlertTitle,
    Slide,
    Typography,
} from '@mui/material';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import GroupIcon from '@mui/icons-material/Group';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

import api from '../services/api';
import { useAuth } from './AuthContext';
import type { NotificationDto, NotificationType } from '../types';
import type { TransitionProps } from '@mui/material/transitions';

interface NotificationContextType {
    notifications: NotificationDto[];
    unreadCount: number;
    isLoading: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

// Zvuk
const playNotificationSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
        console.error(e);
    }
};

function SlideTransition(props: TransitionProps & { children: React.ReactElement<any, any> }) {
    return <Slide {...props} direction="left" />;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<NotificationDto | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const connectionRef = useRef<HubConnection | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await api.get<NotificationDto[]>(`/User/${user.id}/notifications`);
            setNotifications(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (connectionRef.current) {
                connectionRef.current.stop()
                    .then(() => console.log('SignalR Notification Hub Disconnected'))
                    .catch(err => console.error(err));
                connectionRef.current = null;
            }
            setNotifications([]);
            return;
        }

        fetchNotifications();

        const connection = new HubConnectionBuilder()
            .withUrl(`${apiBaseUrl}/notificationHub`, {
                accessTokenFactory: () => user.token
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        connectionRef.current = connection;

        connection.start()
            .then(() => {
                console.log('SignalR Notification Hub Connected');

                connection.on('ReceiveNotification', (notification: any) => {
                    const mapped: NotificationDto = {
                        id: notification.id,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        isRead: notification.isRead,
                        createdAt: notification.createdAt,
                        relatedMatchId: notification.relatedMatchId,
                        relatedTeamId: notification.relatedTeamId
                    };

                    setNotifications(prev => [mapped, ...prev]);
                    playNotificationSound();
                    setToast(mapped);
                    setSnackbarOpen(true);
                });
            })
            .catch(err => console.error('SignalR greska', err));

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
            }
        };
    }, [isAuthenticated, user, fetchNotifications]);

    const markAsRead = async (id: number) => {
        try {
            await api.patch(`/User/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await api.patch(`/User/${user.id}/notifications/read-all`);
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await api.delete(`/User/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        if (!user) return;
        try {
            await api.delete(`/User/${user.id}/notifications/clear`);
            setNotifications([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TeamInvite':
                return <GroupIcon sx={{ fontSize: 24 }} />;
            case 'MatchRescheduled':
            case 'MatchCanceled':
                return <EventAvailableIcon sx={{ fontSize: 24 }} />;
            case 'LeagueStarted':
                return <SportsBasketballIcon sx={{ fontSize: 24, color: '#ff9800' }} />;
            case 'OfficialAssigned':
                return <NotificationsActiveIcon sx={{ fontSize: 24 }} />;
            default:
                return <CampaignIcon sx={{ fontSize: 24 }} />;
        }
    };

    const getAlertSeverity = (type: string) => {
        if (type === 'MatchCanceled') return 'error';
        if (type === 'TeamInvite') return 'info';
        if (type === 'LeagueStarted') return 'success';
        return 'warning';
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll
        }}>
            {children}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                // @ts-ignore
                TransitionComponent={SlideTransition}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                sx={{ mb: 2 }}
            >
                {toast ? (
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={getAlertSeverity(toast.type)}
                        icon={getNotificationIcon(toast.type)}
                        variant="filled"
                        sx={{
                            width: '100%',
                            minWidth: 300,
                            maxWidth: 400,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                            borderRadius: '12px',
                            alignItems: 'center',
                            bgcolor: getAlertSeverity(toast.type) === 'success' ? '#2e7d32' :
                                getAlertSeverity(toast.type) === 'info' ? '#1976d2' :
                                    getAlertSeverity(toast.type) === 'error' ? '#d32f2f' : '#ef6c00'
                        }}
                    >
                        <AlertTitle sx={{ fontWeight: 'bold', mb: 0.2 }}>{toast.title}</AlertTitle>
                        <Typography variant="body2" sx={{ opacity: 0.95 }}>
                            {toast.message}
                        </Typography>
                    </Alert>
                ) : undefined}
            </Snackbar>
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error();
    return ctx;
}
