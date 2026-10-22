import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    Button,
    Divider,
    Grid,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { matchTypeLabel } from '../utils/leagueFormat';
import { LocationPicker } from '../components/LocationPicker';

export default function OrganizerLeaguesPage() {
    const { user } = useAuth();
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [openCreateDialog, setOpenCreateCreateDialog] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leagueForm, setLeagueForm] = useState({
        name: '',
        season: '2026',
        matchType: 2,
        maxTeams: '12',
        entryFee: '0',
        registrationDeadline: '',
        startDate: '',
        description: '',
        location: '',
        isPublic: true,
        latitude: 43.32,
        longitude: 21.89,
    });

    const fetchLeagues = async () => {
        try {
            setLoading(true);
            const res = await api.get('/User/My-Leagues');
            setLeagues(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLeagues();
    }, [user]);

    const handleCreateLeague = async () => {
        setCreating(true);
        setError(null);
        try {
            await api.post('/Leagues/Create-League', {
                ...leagueForm,
                maxTeams: Number(leagueForm.maxTeams),
                entryFee: Number(leagueForm.entryFee),
                latitude: leagueForm.latitude,
                longitude: leagueForm.longitude
            });
            setOpenCreateCreateDialog(false);
            setLeagueForm({
                name: '',
                season: '2026',
                matchType: 2,
                maxTeams: '12',
                entryFee: '0',
                registrationDeadline: '',
                startDate: '',
                description: '',
                location: '',
                isPublic: true,
                latitude: 0,
                longitude: 0
            });
            await fetchLeagues();
        } catch (err: any) {
            const errorData = err.response?.data;
            const message = typeof errorData === 'string' 
                ? errorData 
                : (errorData?.title || 'Greška pri kreiranju lige.');
            setError(message);
        } finally {
            setCreating(false);
        }
    };

    if (loading && leagues.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ direction: "row", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Moje lige</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => setOpenCreateCreateDialog(true)}
                        sx={{ fontWeight: 700, borderRadius: 2, mt: 1 }}
                    >
                        Nova liga
                    </Button>
                </Stack>

                <Grid container spacing={3}>
                    {leagues.map((league) => (
                        <Grid size={{ xs: 12, md: 6 }} key={league.id}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{league.name}</Typography>
                                        <Chip label={matchTypeLabel(league.matchType)} color="primary" size="small" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Sezona: {league.season} • Timovi: {league.teamCount}/{league.maxTeams}
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                                        <Button component={RouterLink} to={`/leagues/${league.id}`} variant="outlined" size="small">Pregledaj</Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {leagues.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body1" sx={{ textAlign: 'center', py: 5 }} color="text.secondary">
                                Još uvek niste kreirali nijednu ligu.
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Container>

            {/* Kreiranje lige */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateCreateDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>Kreiraj novu ligu</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="Naziv lige"
                            fullWidth
                            value={leagueForm.name}
                            onChange={(e) => setLeagueForm({ ...leagueForm, name: e.target.value })}
                        />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Format</InputLabel>
                                    <Select
                                        value={leagueForm.matchType}
                                        label="Format"
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLeagueForm(prev => ({ 
                                                ...prev, 
                                                matchType: val,
                                                location: val === 1 ? '' : prev.location,
                                                latitude: val === 1 ? 0 : prev.latitude,
                                                longitude: val === 1 ? 0 : prev.longitude
                                            }));
                                        }}
                                    >
                                        <MenuItem value={2}>Basket 3x3</MenuItem>
                                        <MenuItem value={1}>Košarka 5x5</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Sezona"
                                    fullWidth
                                    value={leagueForm.season}
                                    onChange={(e) => setLeagueForm({ ...leagueForm, season: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Maks. timova"
                                    fullWidth
                                    value={leagueForm.maxTeams}
                                    onChange={(e) => setLeagueForm({ ...leagueForm, maxTeams: e.target.value })}
                                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', min: 2, max: 100 } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Kotizacija"
                                    fullWidth
                                    value={leagueForm.entryFee}
                                    onChange={(e) => setLeagueForm({ ...leagueForm, entryFee: e.target.value })}
                                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', min: 0 } }}
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            label="Rok prijave"
                            type="datetime-local"
                            fullWidth
                            value={leagueForm.registrationDeadline}
                            onChange={(e) => setLeagueForm({ ...leagueForm, registrationDeadline: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            label="Početak"
                            type="datetime-local"
                            fullWidth
                            value={leagueForm.startDate}
                            onChange={(e) => setLeagueForm({ ...leagueForm, startDate: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            label="Opis lige"
                            multiline
                            rows={3}
                            fullWidth
                            value={leagueForm.description}
                            onChange={(e) => setLeagueForm({ ...leagueForm, description: e.target.value })}
                        />
                            <TextField
                            label="Lokacija"
                            fullWidth
                            value={leagueForm.location}
                            onChange={(e) => setLeagueForm({ ...leagueForm, location: e.target.value })}
                            placeholder="npr. Beograd, Srbija"
                        />
                        
                        {leagueForm.matchType === 2 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Izaberi tačnu lokaciju na mapi:
                                </Typography>
                                <LocationPicker 
                                    onLocationSelect={(lat, lng, address) => 
                                        setLeagueForm(prev => ({ 
                                            ...prev,
                                            latitude: lat, 
                                            longitude: lng,
                                            location: address
                                        }))
                                    } 
                                />
                            </Box>
                        )}
                        
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenCreateCreateDialog(false)}>Otkaži</Button>
                    <Button
                        onClick={handleCreateLeague}
                        variant="contained"
                        disabled={creating || !leagueForm.name || !leagueForm.registrationDeadline}
                    >
                        {creating ? <CircularProgress size={24} /> : "Kreiraj ligu"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}