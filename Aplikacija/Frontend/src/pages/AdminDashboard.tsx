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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [officialEmail, setOfficialEmail] = useState('');
    const [officialUsername, setOfficialUsername] = useState('');
    const [officialPassword, setOfficialPassword] = useState('');
    const [officialRole, setOfficialRole] = useState(2); // Organizer
    const [users, setUsers] = useState<any[]>([]);
    const [leagueForm, setLeagueForm] = useState({
        name: '',
        matchType: 2,
        maxTeams: 12,
        entryFee: 0,
        registrationDeadline: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/Admin/List-Users`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setUsers(usersRes.data);
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleToggleActive = async (username: string, currentStatus: boolean) => {
        try {
            const endpoint = currentStatus ? 'Deactivate-User' : 'Activate-User';
            await axios.put(`${import.meta.env.VITE_API_URL}/Admin/${endpoint}`, { username }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            fetchData();
        } catch (err) { alert("Greška pri promeni statusa."); }
    };

    const handleCreateOfficial = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/Admin/Create-Official-Account/${officialRole}`, {
                username: officialUsername,
                email: officialEmail,
                password: officialPassword
            }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            alert("Nalog kreiran!");
            setOfficialUsername('');
            setOfficialEmail('');
            setOfficialPassword('');
            fetchData();
        } catch (err) { alert("Greška pri kreiranju naloga."); }
    };

    const handleCreateLeague = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/Leagues/Create-League`, {
                ...leagueForm,
                isPublic: true
            }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            alert("Takmičenje kreirano!");
        } catch (err) { alert("Greška pri kreiranju takmičenja."); }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="xl" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>Admin panel</Typography>
                        <Typography variant="body2" color="text.secondary">Potpuna kontrola nad sistemom i korisnicima.</Typography>
                    </Box>
                    <IconButton onClick={fetchData} color="primary"><RefreshIcon /></IconButton>
                </Stack>

                <Grid container spacing={3}>
                    {/* Kreiranje Službenih */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <AdminPanelSettingsIcon color="secondary" />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Službeni nalog</Typography>
                                </Stack>
                                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Username" value={officialUsername} onChange={(e) => setOfficialUsername(e.target.value)} fullWidth size="small" />
                                    <TextField label="Email" value={officialEmail} onChange={(e) => setOfficialEmail(e.target.value)} fullWidth size="small" />
                                    <TextField label="Lozinka" type="password" value={officialPassword} onChange={(e) => setOfficialPassword(e.target.value)} fullWidth size="small" />
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Uloga</InputLabel>
                                        <Select value={officialRole} label="Uloga" onChange={(e) => setOfficialRole(e.target.value as number)}>
                                            <MenuItem value={2}>Organizator</MenuItem>
                                            <MenuItem value={3}>Sudija</MenuItem>
                                            <MenuItem value={4}>Zapisničar</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button variant="contained" fullWidth onClick={handleCreateOfficial}>Kreiraj</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Kreiranje Lige */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <EmojiEventsIcon sx={{ color: '#10b981' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Nova liga</Typography>
                                </Stack>
                                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField label="Naziv" value={leagueForm.name} onChange={(e) => setLeagueForm({ ...leagueForm, name: e.target.value })} fullWidth size="small" />
                                    <TextField
                                        label="Rok prijave"
                                        type="date"
                                        value={leagueForm.registrationDeadline}
                                        onChange={(e) => setLeagueForm({ ...leagueForm, registrationDeadline: e.target.value })}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        fullWidth
                                        size="small"
                                    />
                                    <Button variant="outlined" fullWidth onClick={handleCreateLeague}>Sačuvaj</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Za upravljanje postojećim korisnicima (aktivacija/deaktivacija), koristite pretragu na početnoj stranici da biste pristupili njihovim profilima.
                        </Alert>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}