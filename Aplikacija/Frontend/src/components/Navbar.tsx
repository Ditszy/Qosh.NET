import React, { useState, useEffect, useRef } from 'react';
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
    InputBase,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    Drawer,
    alpha,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
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
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GavelIcon from '@mui/icons-material/Gavel';
import RateReviewIcon from '@mui/icons-material/RateReview';
import MailIcon from '@mui/icons-material/Mail';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { mode, toggleTheme } = useThemeContext();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const notifButtonRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                try {
                    const res = await api.get(`/User/Search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchResults(res.data || []);
                    setSearchOpen(true);
                } catch (err) {
                    console.error(err);
                    setSearchResults([]);
                }
            } else {
                setSearchResults([]);
                setSearchOpen(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSelect = (userId: number) => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchOpen(false);
        setMobileOpen(false);
        navigate(`/profile/${userId}`);
    };

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
        setMobileOpen(false);
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

    const navLinks = () => (
        <>
            <ListItemButton
                component={RouterLink}
                to="/"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
            >
                <ListItemIcon sx={{ minWidth: 40 }}><HomeIcon /></ListItemIcon>
                <ListItemText primary="Početna" />
            </ListItemButton>
            <ListItemButton
                component={RouterLink}
                to="/leagues"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
            >
                <ListItemIcon sx={{ minWidth: 40 }}><EmojiEventsIcon /></ListItemIcon>
                <ListItemText primary="Lige" />
            </ListItemButton>
            <ListItemButton
                component={RouterLink}
                to="/leaderboard"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
            >
                <ListItemIcon sx={{ minWidth: 40 }}><EmojiEventsIcon /></ListItemIcon>
                <ListItemText primary="Rang lista" />
            </ListItemButton>

            {isAuthenticated && hasRole(UserRole.Captain, UserRole.Player) && (
                <>
                    <ListItemButton
                        component={RouterLink}
                        to="/team"
                        onClick={() => setMobileOpen(false)}
                        sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}><SportsBasketballIcon /></ListItemIcon>
                        <ListItemText primary="Moj tim" />
                    </ListItemButton>
                    <ListItemButton
                        component={RouterLink}
                        to="/invites"
                        onClick={() => setMobileOpen(false)}
                        sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}><MailIcon /></ListItemIcon>
                        <ListItemText primary="Pozivnice" />
                    </ListItemButton>
                </>
            )}
            {isAuthenticated && hasRole(UserRole.Organizer) && (
                <ListItemButton
                    component={RouterLink}
                    to="/organizer/leagues"
                    onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, mb: 0.5 }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}><SportsBasketballIcon /></ListItemIcon>
                    <ListItemText primary="Moje lige" />
                </ListItemButton>
            )}
            {isAuthenticated && hasRole(UserRole.Scorer) && (
                <ListItemButton
                    component={RouterLink}
                    to="/scorer"
                    onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, mb: 0.5 }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}><RateReviewIcon /></ListItemIcon>
                    <ListItemText primary="Zapisničar" />
                </ListItemButton>
            )}
            {isAuthenticated && hasRole(UserRole.Referee) && (
                <ListItemButton
                    component={RouterLink}
                    to="/referee"
                    onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, mb: 0.5 }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}><GavelIcon /></ListItemIcon>
                    <ListItemText primary="Sudija" />
                </ListItemButton>
            )}
            {isAuthenticated && hasRole(UserRole.Admin) && (
                <ListItemButton
                    component={RouterLink}
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, mb: 0.5 }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}><AdminPanelSettingsIcon /></ListItemIcon>
                    <ListItemText primary="Admin" />
                </ListItemButton>
            )}
        </>
    );

    const mobileDrawer = (
        <Box sx={{ width: 280, pt: 1 }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SportsBasketballIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>QOSH</Typography>
                <Box sx={{ ml: 'auto' }}>
                    <IconButton onClick={toggleTheme} size="small">
                        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                    </IconButton>
                </Box>
            </Box>
            <Divider sx={{ mb: 1 }} />

            {isAuthenticated && (
                <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar
                        src={fullProfilePicUrl || undefined}
                        sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.95rem', fontWeight: 'bold' }}
                    >
                        {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{user?.username}</Typography>
                    </Box>
                    <IconButton onClick={() => { setNotifAnchorEl(notifButtonRef.current); }} color="inherit" size="small">
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                </Box>
            )}

            <Divider sx={{ mb: 1 }} />

            <List disablePadding sx={{ px: 1 }}>
                {navLinks()}
            </List>

            <Divider sx={{ my: 1 }} />

            <List disablePadding sx={{ px: 1 }}>
                {isAuthenticated ? (
                    <>
                        <ListItemButton
                            onClick={() => { navigate(`/profile/${user?.id}`); setMobileOpen(false); }}
                            sx={{ borderRadius: 2, mb: 0.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}><PersonIcon /></ListItemIcon>
                            <ListItemText primary="Moj profil" />
                        </ListItemButton>
                        <ListItemButton
                            onClick={() => { navigate('/settings'); setMobileOpen(false); }}
                            sx={{ borderRadius: 2, mb: 0.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Podešavanja" />
                        </ListItemButton>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{ borderRadius: 2, color: 'error.main' }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}><LogoutIcon color="error" /></ListItemIcon>
                            <ListItemText primary="Odjavi se" sx={{ fontWeight: 'bold' }} />
                        </ListItemButton>
                    </>
                ) : (
                    <>
                        <ListItemButton
                            component={RouterLink}
                            to="/login"
                            onClick={() => setMobileOpen(false)}
                            sx={{ borderRadius: 2, mb: 0.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}><LoginIcon /></ListItemIcon>
                            <ListItemText primary="Prijava" />
                        </ListItemButton>
                        <ListItemButton
                            component={RouterLink}
                            to="/register"
                            onClick={() => setMobileOpen(false)}
                            sx={{ borderRadius: 2, mb: 0.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}><HowToRegIcon /></ListItemIcon>
                            <ListItemText primary="Registracija" />
                        </ListItemButton>
                    </>
                )}
            </List>
        </Box>
    );

    return (
        <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    component={RouterLink}
                    to="/"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
                >
                    <SportsBasketballIcon sx={{ color: 'primary.main', fontSize: 30 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
                        QOSH
                    </Typography>
                </Box>

                {!isMobile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 3 }}>                        <Button component={RouterLink} to="/leagues" color="primary" sx={{ fontWeight: 600 }}>
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
                )}

                <Box
                    ref={searchRef}
                    sx={{ flexGrow: 1, maxWidth: { xs: 'none', sm: 340 }, mx: { xs: 1, sm: 2 }, position: 'relative' }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                            borderRadius: 3,
                            px: 1.5,
                            py: 0.5,
                            border: `1.5px solid ${searchOpen && searchResults.length > 0 ? theme.palette.primary.main : 'transparent'}`,
                            transition: 'border-color 0.2s',
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.09),
                            }
                        }}
                    >
                        <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                        <InputBase
                            placeholder="Pretraži igrače..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                            sx={{ fontSize: '0.9rem', width: '100%' }}
                        />
                    </Box>

                    {searchOpen && searchResults.length > 0 && (
                        <Paper
                            elevation={8}
                            sx={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                left: 0,
                                right: 0,
                                zIndex: 1400,
                                borderRadius: 3,
                                overflow: 'hidden',
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                maxHeight: 320,
                                overflowY: 'auto',
                            }}
                        >
                            <List disablePadding>
                                {searchResults.map((player, idx) => (
                                    <ListItem
                                        key={player.id}
                                        disablePadding
                                        divider={idx < searchResults.length - 1}
                                    >
                                        <ListItemButton
                                            onClick={() => handleSearchSelect(player.id)}
                                            sx={{ py: 1.2, px: 2 }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 44 }}>
                                                <Avatar
                                                    src={player.profilePictureUrl}
                                                    sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.8rem' }}
                                                >
                                                    {player.firstName ? player.firstName.charAt(0) : <PersonIcon fontSize="small" />}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`${player.firstName || ''} ${player.lastName || ''}`.trim() || player.username}
                                                secondary={`@${player.username}`}
                                                slotProps={{
                                                    primary: { sx: { fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3 } },
                                                    secondary: { sx: { fontSize: '0.78rem' } }
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>

                <Box ref={notifButtonRef} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
                    <Tooltip title={mode === 'light' ? 'Tamna tema' : 'Svetla tema'}>
                        <IconButton onClick={toggleTheme} color="inherit" size="small">
                            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                        </IconButton>
                    </Tooltip>

                    {isMobile && (
                        <IconButton onClick={() => setMobileOpen(true)} color="inherit" size="small">
                            <MenuIcon />
                        </IconButton>
                    )}

                    {!isMobile && !isAuthenticated && (
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
                    )}

                    {!isMobile && isAuthenticated && (
                        <IconButton onClick={handleNotifOpen} color="inherit">
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    )}

                    {!isMobile && isAuthenticated && (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: '500', color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                                {user?.username}
                            </Typography>

                            <Tooltip title="Profil i podešavanja">
                                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                                    <Avatar
                                        src={fullProfilePicUrl || undefined}
                                        sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.95rem', fontWeight: 'bold' }}
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

            <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                slotProps={{
                    paper: {
                        sx: { bgcolor: 'background.paper', color: 'text.primary' }
                    }
                }}
            >
                {mobileDrawer}
            </Drawer>

            {isAuthenticated && (
                <Menu
                    anchorEl={notifAnchorEl}
                    open={notifOpen}
                    onClose={handleNotifClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
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
                                border: `1px solid ${theme.palette.divider}`
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
                                        borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${theme.palette.primary.main}`,
                                        bgcolor: n.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
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
            )}
        </AppBar>
    );
}
