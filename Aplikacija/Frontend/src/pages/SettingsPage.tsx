import { useState, useEffect, useRef } from 'react';
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
    IconButton
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function SettingsPage() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<any>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        jerseyNumber: '',
        profilePictureUrl: '',
        dateOfBirth: ''
    });

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/User/${user?.id}/profile`);
            const p = res.data;
            setFormData({
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                jerseyNumber: p.jerseyNumber || '',
                profilePictureUrl: p.profilePictureUrl || '',
                dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : ''
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put(`/User/${user?.id}/update`, {
                ...formData,
                jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null
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
            await api.post(`/User/Set-Profile-Picture`, uploadData);
            await fetchProfile();
            setMessage({ type: 'success', text: 'Slika profila uspešno promenjena!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data || 'Greška pri otpremanju slike.' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const fullProfilePicUrl = formData.profilePictureUrl ? (formData.profilePictureUrl.startsWith('http') ? formData.profilePictureUrl : `${apiBaseUrl}${formData.profilePictureUrl}`) : '';

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />
            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Podešavanja profila</Typography>

                {message && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}

                <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={fullProfilePicUrl}
                                        sx={{ width: 120, height: 120, border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    >
                                        {formData.firstName?.charAt(0)}
                                    </Avatar>
                                    <IconButton
                                        color="primary"
                                        component="label"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            bgcolor: 'white',
                                            '&:hover': { bgcolor: '#f5f5f5' },
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                        disabled={uploading}
                                    >
                                        <input
                                            hidden
                                            accept="image/*"
                                            type="file"
                                            onChange={handleFileChange}
                                        />
                                        <PhotoCameraIcon />
                                    </IconButton>
                                    {uploading && (
                                        <CircularProgress
                                            size={120}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                zIndex: 1,
                                            }}
                                        />
                                    )}
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    Kliknite na ikonicu kamere da promenite sliku
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth label="Ime"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth label="Prezime"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth label="Broj dresa" type="number"
                                    value={formData.jerseyNumber}
                                    onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    fullWidth label="Datum rođenja" type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button
                                    variant="contained" size="large" sx={{ fontWeight: 700, borderRadius: 2 }}
                                    onClick={handleSave} disabled={saving}
                                >
                                    {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}
