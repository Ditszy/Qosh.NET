import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Avatar,
    IconButton,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import DangerousIcon from '@mui/icons-material/Dangerous';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/User/${user?.id}/profile`);
            const p = res.data;
            setFirstName(p.firstName || '');
            setLastName(p.lastName || '');
            setProfilePictureUrl(p.profilePictureUrl || '');
            setDateOfBirth(p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put(`/User/${user?.id}/update`, {
                firstName,
                lastName,
                profilePictureUrl,
                dateOfBirth: dateOfBirth || null
            });
            setMessage({ type: 'success', text: 'Profil uspešno ažuriran!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Greška pri čuvanju podataka.' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await api.post(`/User/Set-Profile-Picture`, uploadData);
            setProfilePictureUrl(res.data.profilePictureUrl || profilePictureUrl);
            await fetchProfile();
            setMessage({ type: 'success', text: 'Slika profila uspešno promenjena!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data || 'Greška pri otpremanju slike.' });
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordMessage(null);

        if (!currentPassword || !newPassword) {
            setPasswordMessage({ type: 'error', text: 'Popunite sva polja.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Nove lozinke se ne poklapaju.' });
            return;
        }

        setChangingPassword(true);
        try {
            await api.put(`/User/${user?.id}/change-password`, {
                currentPassword,
                newPassword
            });
            setPasswordMessage({ type: 'success', text: 'Lozinka je uspešno promenjena!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            const text = typeof err.response?.data === 'string'
                ? err.response.data
                : 'Greška pri promeni lozinke.';
            setPasswordMessage({ type: 'error', text });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await api.delete(`/User/${user?.id}/delete`);
            await logout();
        } catch (err: any) {
            const text = typeof err.response?.data === 'string'
                ? err.response.data
                : 'Greška pri brisanju naloga.';
            setPasswordMessage({ type: 'error', text });
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const fullProfilePicUrl = profilePictureUrl
        ? (profilePictureUrl.startsWith('http') ? profilePictureUrl : `${apiBaseUrl}${profilePictureUrl}`)
        : '';

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />
            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>Podešavanja</Typography>

                {/*Profil*/}
                <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Profil</Typography>
                        </Stack>

                        {message && <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={fullProfilePicUrl}
                                        sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: '2.5rem' }}
                                    >
                                        {firstName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase()}
                                    </Avatar>
                                    <IconButton
                                        color="primary"
                                        component="label"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            bgcolor: 'background.paper',
                                            '&:hover': { bgcolor: 'action.hover' },
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                        disabled={uploading}
                                    >
                                        <input hidden accept="image/*" type="file" onChange={handleFileChange} />
                                        <PhotoCameraIcon fontSize="small" />
                                    </IconButton>
                                    {uploading && (
                                        <CircularProgress size={100} sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
                                    )}
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    @{user?.username}
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Ime" value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Prezime" value={lastName}
                                    onChange={(e) => setLastName(e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth label="Datum rođenja" type="date" value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button variant="contained" sx={{ fontWeight: 700, borderRadius: 2 }}
                                    onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? <CircularProgress size={24} color="inherit" /> : 'Sačuvaj izmene'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Promena sifre */}
                <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <LockIcon sx={{ color: 'warning.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Promena lozinke</Typography>
                        </Stack>

                        {passwordMessage && <Alert severity={passwordMessage.type} sx={{ mb: 3 }} onClose={() => setPasswordMessage(null)}>{passwordMessage.text}</Alert>}

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth type="password" label="Trenutna lozinka"
                                    value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth type="password" label="Nova lozinka"
                                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField fullWidth type="password" label="Potvrdi novu lozinku"
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button variant="outlined" color="warning" sx={{ fontWeight: 700, borderRadius: 2 }}
                                    onClick={handleChangePassword} disabled={changingPassword}>
                                    {changingPassword ? <CircularProgress size={24} color="inherit" /> : 'Promeni lozinku'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Brisanje naloga */}
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'error.main', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <DangerousIcon sx={{ color: 'error.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>Pažljivo!</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Brisanje naloga je trajna akcija. Vaši podaci će biti anonimizirani i neće biti moguće oporaviti nalog.
                        </Typography>
                        <Button variant="outlined" color="error" sx={{ fontWeight: 700, borderRadius: 2 }}
                            onClick={() => { setDeleteDialogOpen(true); setDeleteConfirmText(''); }}>
                            Obriši nalog
                        </Button>
                    </CardContent>
                </Card>

                {/* Potvrda za brisanje */}
                <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}
                    sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}>
                    <DialogTitle sx={{ fontWeight: 800 }}>Potvrdi brisanje naloga</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Ova akcija se ne može poništiti. Svi vaši podaci će biti trajno obrisani.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Ukucajte <strong>OBRISI</strong> da potvrdite:
                        </Typography>
                        <TextField fullWidth value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="OBRISI" autoFocus />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ fontWeight: 700 }}>
                            Otkaži
                        </Button>
                        <Button color="error" variant="contained" disabled={deleteConfirmText !== 'OBRISI' || deleting}
                            onClick={handleDeleteAccount} sx={{ fontWeight: 700 }}>
                            {deleting ? <CircularProgress size={24} color="inherit" /> : 'Obriši nalog'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
