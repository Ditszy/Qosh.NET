import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Avatar,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
} from '@mui/material';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import GroupIcon from '@mui/icons-material/Group';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { UserRole } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function Navbar() {
    const { user, isAuthenticated, logout, hasRole } = useAuth();
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotifications();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const [profilePic, setProfilePic] = useState<string | null>(null);

    const open = Boolean(anchorEl);
    const notifOpen = Boolean(notifAnchorEl);

    const fetchUserData = async () => {
        try {
            const profileRes = await api.get(`/User/${user?.id}/profile`);
            setProfilePic(profileRes.data.profilePictureUrl || null);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUserData();
        }
    }, [isAuthenticated, user]);

    const fullProfilePicUrl = profilePic ? (profilePic.startsWith('http') ? profilePic : `${apiBaseUrl}${profilePic}`) : null;

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
        setNotifAnchorEl(event.currentTarget);
    };

    const handleNotifClose = () => {
        setNotifAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/');
    };

    const formatTimeAgo = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'malopre';
            if (diffMins < 60) return `pre ${diffMins}m`;
            if (diffHours < 24) return `pre ${diffHours}h`;
            return `pre ${diffDays}d`;
        } catch {
            return '';
        }
    };

    const handleNotificationClick = async (notification: any) => {
        try {
            if (!notification.isRead) {
                await markAsRead(notification.id);
            }

            handleNotifClose();

            if (notification.relatedMatchId) {
                if (hasRole(UserRole.Scorer)) {
                    navigate(`/scorer/matches/${notification.relatedMatchId}`);
                } else {
                    navigate(`/matches/${notification.relatedMatchId}`);
                }
            } else if (notification.relatedTeamId) {
                if (hasRole(UserRole.Organizer)) {
                    navigate('/organizer/leagues');
                } else {
                    navigate('/team');
                }
            } else if (notification.title?.toLowerCase().includes("pozivnica") || notification.type === 'TeamInvite') {
                navigate('/invites');
            }
        } catch (err) { console.error(err); }
    };

    const getNotificationMenuIcon = (type: string) => {
        switch (type) {
            case 'TeamInvite':
                return <GroupIcon sx={{ color: '#1976d2' }} />;
            case 'MatchRescheduled':
            case 'MatchCanceled':
                return <EventAvailableIcon sx={{ color: '#ef5350' }} />;
            case 'LeagueStarted':
                return <SportsBasketballIcon sx={{ color: '#ff9800' }} />;
            case 'OfficialAssigned':
                return <NotificationsActiveIcon sx={{ color: '#4caf50' }} />;
            default:
                return <CampaignIcon sx={{ color: '#78909c' }} />;
        }
    };

    return (
        <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: '#fff' }}>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    component={RouterLink}
                    to="/"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}
                >
                    <SportsBasketballIcon sx={{ color: '#1976d2', fontSize: 30 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
                        QOSH
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 3, flexGrow: 1 }}>
                    <Button component={RouterLink} to="/leagues" color="primary" sx={{ fontWeight: 600 }}>
                        Lige
                    </Button>
                    <Button component={RouterLink} to="/leaderboard" color="primary" sx={{ fontWeight: 600 }}>
                        Rang lista
                    </Button>
                    {isAuthenticated && hasRole(UserRole.Captain, UserRole.Player) && (
                        <>
                            <Button component={RouterLink} to="/team" color="primary" sx={{ fontWeight: 600 }}>
                                Moj tim
                            </Button>
                            <Button component={RouterLink} to="/invites" color="primary" sx={{ fontWeight: 600 }}>
                                Pozivnice
                            </Button>
                        </>
                    )}
                    {isAuthenticated && hasRole(UserRole.Organizer) && (
                        <Button component={RouterLink} to="/organizer/leagues" color="primary" sx={{ fontWeight: 600 }}>
                            Moje lige
                        </Button>
                    )}
                    {isAuthenticated && hasRole(UserRole.Scorer) && (
                        <Button component={RouterLink} to="/scorer" color="primary" sx={{ fontWeight: 600 }}>
                            Zapisničar
                        </Button>
                    )}
                    {isAuthenticated && hasRole(UserRole.Referee) && (
                        <Button component={RouterLink} to="/referee" color="primary" sx={{ fontWeight: 600 }}>
                            Sudija
                        </Button>
                    )}
                    {isAuthenticated && hasRole(UserRole.Admin) && (
                        <Button component={RouterLink} to="/admin" color="primary" sx={{ fontWeight: 600 }}>
                            Admin
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
                    {!isAuthenticated ? (
                        <>
                            <Button
                                component={RouterLink}
                                to="/login"
                                color="primary"
                                sx={{ fontWeight: 'bold' }}
                            >
                                Prijava
                            </Button>
                            <Button
                                component={RouterLink}
                                to="/register"
                                variant="contained"
                                color="primary"
                                sx={{ fontWeight: 'bold', borderRadius: 2 }}
                            >
                                Registracija
                            </Button>
                        </>
                    ) : (
                        <>
                            <IconButton onClick={handleNotifOpen} color="inherit">
                                <Badge badgeContent={unreadCount} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>

                            <Menu
                                anchorEl={notifAnchorEl}
                                open={notifOpen}
                                onClose={handleNotifClose}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                slotProps={{
                                    paper: {
                                        elevation: 6,
                                        sx: {
                                            borderRadius: 3,
                                            mt: 1.5,
                                            minWidth: 320,
                                            maxWidth: 380,
                                            maxHeight: 450,
                                            boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.12)',
                                            border: '1px solid rgba(0, 0, 0, 0.08)'
                                        }
                                    }
                                }}
                            >
                                <Box sx={{ p: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        Obaveštenja
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {unreadCount > 0 && (
                                            <Tooltip title="Označi sve kao pročitano">
                                                <IconButton size="small" onClick={markAllAsRead} color="primary">
                                                    <DoneAllIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {notifications.length > 0 && (
                                            <Tooltip title="Obriši sva obaveštenja">
                                                <IconButton size="small" onClick={clearAll} color="error">
                                                    <DeleteSweepIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                                <Divider />
                                {notifications.length === 0 ? (
                                    <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                                        <NotificationsActiveIcon sx={{ fontSize: 32, mb: 1, color: 'text.secondary' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Nema novih obaveštenja</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                                        {notifications.map(n => (
                                            <MenuItem
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                sx={{
                                                    whiteSpace: 'normal',
                                                    py: 1.5,
                                                    px: 2,
                                                    borderLeft: n.isRead ? '3px solid transparent' : '3px solid #1976d2',
                                                    bgcolor: n.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.03)',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover'
                                                    },
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 'auto', mt: 0.5 }}>
                                                    {getNotificationMenuIcon(n.type)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={n.title}
                                                    secondary={
                                                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                                            <Typography variant="body2" component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.85rem' }}>
                                                                {n.message}
                                                            </Typography>
                                                            <Typography variant="caption" component="span" sx={{ display: 'block', mt: 0.5, color: 'text.disabled', fontWeight: 500 }}>
                                                                {formatTimeAgo(n.createdAt)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    slotProps={{
                                                        primary: {
                                                            variant: 'body2',
                                                            sx: { fontWeight: n.isRead ? 500 : 700, color: 'text.primary' }
                                                        }
                                                    }}
                                                    sx={{ m: 0 }}
                                                />
                                                <Tooltip title="Obriši">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(n.id);
                                                        }}
                                                        sx={{
                                                            ml: 'auto',
                                                            alignSelf: 'center',
                                                            opacity: 0.4,
                                                            '&:hover': {
                                                                opacity: 1,
                                                                color: 'error.main'
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </MenuItem>
                                        ))}
                                    </Box>
                                )}
                            </Menu>

                            <Typography variant="body2" sx={{ fontWeight: '500', color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                                {user?.username}
                            </Typography>

                            <Tooltip title="Profil i podešavanja">
                                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                                    <Avatar
                                        src={fullProfilePicUrl || undefined}
                                        sx={{ bgcolor: '#1976d2', width: 36, height: 36, fontSize: '0.95rem', fontWeight: 'bold' }}
                                    >
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                                onClick={handleMenuClose}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                slotProps={{
                                    paper: {
                                        elevation: 3,
                                        sx: { borderRadius: 2, mt: 1, minWidth: 150 }
                                    }
                                }}
                            >
                                <MenuItem onClick={() => navigate(`/profile/${user?.id}`)}>
                                    <ListItemIcon>
                                        <SportsBasketballIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Moj profil" />
                                </MenuItem>
                                <MenuItem onClick={() => navigate('/settings')}>
                                    <ListItemIcon>
                                        <SportsBasketballIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Podešavanja" />
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small" color="error" />
                                    </ListItemIcon>
                                    <ListItemText primary="Odjavi se" sx={{ fontWeight: 'bold' }} />
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}