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
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function Navbar() {
    const { user, isAuthenticated, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [profilePic, setProfilePic] = useState<string | null>(null);

    const open = Boolean(anchorEl);
    const notifOpen = Boolean(notifAnchorEl);

    const fetchUserData = async () => {
        try {
            const [notifRes, profileRes] = await Promise.all([
                api.get(`/User/${user?.id}/notifications`),
                api.get(`/User/${user?.id}/profile`)
            ]);
            setNotifications(notifRes.data || []);
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

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (notification: any) => {
        try {
            if (!notification.isRead) {
                await api.patch(`/User/notifications/${notification.id}/read`);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
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
            } else if (notification.title?.includes("pozivnica")) {
                navigate('/invites');
            }
        } catch (err) { console.error(err); }
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
                                        elevation: 3,
                                        sx: { borderRadius: 2, mt: 1, minWidth: 280, maxWidth: 350, maxHeight: 400 }
                                    }
                                }}
                            >
                                <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Obaveštenja</Typography>
                                </Box>
                                <Divider />
                                {notifications.length === 0 ? (
                                    <MenuItem disabled><Typography variant="body2">Nema obaveštenja</Typography></MenuItem>
                                ) : (
                                    notifications.map(n => (
                                        <MenuItem
                                            key={n.id}
                                            onClick={() => handleMarkAsRead(n)}
                                            sx={{ whiteSpace: 'normal', bgcolor: n.isRead ? 'transparent' : 'action.hover' }}
                                        >
                                            <ListItemText
                                                primary={n.title}
                                                secondary={n.message}
                                                slotProps={{
                                                    primary: {
                                                        variant: 'body2',
                                                        sx: { fontWeight: n.isRead ? 'normal' : 'bold' }
                                                    },
                                                    secondary: {
                                                        variant: 'caption'
                                                    }
                                                }}
                                            />
                                        </MenuItem>
                                    ))
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