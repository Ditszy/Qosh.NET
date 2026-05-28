import React from 'react';
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
} from '@mui/material';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/'); // Da se vrati na pocetnu
    };

    return (
        <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: '#fff' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {!isAuthenticated ? (
                        // Ako korisnik nije ulogovan
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
                        // Ako je korisnik ulogovan
                        <>
                            <Typography variant="body2" sx={{ fontWeight: '500', color: 'text.secondary' }}>
                                {user?.username}
                            </Typography>

                            <Tooltip title="Profil i podešavanja">
                                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                                    <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36, fontSize: '0.95rem', fontWeight: 'bold' }}>
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