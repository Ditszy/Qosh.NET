import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    TextField,
    Button,
    Divider,
    Grid,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Alert,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Avatar,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function TeamProfilePage() {
    const { user } = useAuth();
    const location = useLocation();
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [roster, setRoster] = useState<any[]>([]);
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [newTeam, setNewTeam] = useState({
        name: '',
        city: '',
        leagueId: (location.state as any)?.leagueId || '',
    });

    const [invitePlayerId, setInvitePlayerId] = useState('');
    const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const profileRes = await api.get(`/User/${user?.id}/profile`);
            const teams = profileRes.data.teams || [];
            setAllTeams(teams);

            if ((location.state as any)?.leagueId) {
                setShowCreateForm(true);
            } else if (teams.length > 0 && !selectedTeam) {
                handleSelectTeam(teams[0]);
            } else if (selectedTeam) {
                const current = teams.find((t: any) => t.teamId === selectedTeam.teamId);
                if (current) setSelectedTeam(current);
            }

            const leaguesRes = await api.get(`/Leagues/Get-Active-Leagues?OnlyRegistrationOpen=true`);
            setLeagues(leaguesRes.data || []);

            const playersRes = await api.get(`/Invite/Get-Available-Players`);
            setAvailablePlayers(playersRes.data || []);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTeam = async (team: any) => {
        setSelectedTeam(team);
        setShowCreateForm(false);
        setError(null);
        setInviteSuccess(null);
        try {
            const rosterRes = await api.get(`/Team/Get-Team-Roster/${team.teamId}`);
            setRoster(rosterRes.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleCreateTeam = async () => {
        setError(null);
        try {
            await api.post(`/Team/Create-Team`, {
                name: newTeam.name,
                city: newTeam.city,
                leagueId: Number(newTeam.leagueId)
            });
            setNewTeam({ name: '', city: '', leagueId: '' });
            setShowCreateForm(false);
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Greška pri kreiranju tima.');
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTeam) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            await api.post(`/Team/Upload-Team-Logo?teamId=${selectedTeam.teamId}`, uploadData);
            fetchData();
            setInviteSuccess('Logo tima je uspešno promenjen!');
        } catch (err: any) {
            const errorData = err.response?.data;
            setError(typeof errorData === 'string' ? errorData : (errorData?.title || 'Greška pri otpremanju logotipa.'));
        } finally {
            setUploading(false);
        }
        };

        const handleSendInvite = async () => {
        setError(null);
        setInviteSuccess(null);
        try {
            await api.post(`/Invite/Send-Invite`, {
                teamId: selectedTeam.teamId,
                targetUserId: Number(invitePlayerId)
            });
            setInviteSuccess('Pozivnica je uspešno poslata!');
            setInvitePlayerId('');
        } catch (err: any) {
            const errorData = err.response?.data;
            setError(typeof errorData === 'string' ? errorData : (errorData?.title || 'Greška pri slanju pozivnice.'));
        }
    };

    const handleRemovePlayer = async (targetUserId: any) => {
        const id = Number(targetUserId);
        if (!id) return;
        if (!window.confirm('Da li ste sigurni da želite da uklonite ovog igrača iz tima?')) return;
        setError(null);
        try {
            await api.patch(
                `/Team/Remove-Player/${selectedTeam.teamId}/${id}`,
                {}
            );
            handleSelectTeam(selectedTeam);
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Greška pri uklanjanju igrača.');
        }
    };

    const handleDisbandTeam = async () => {
        if (!window.confirm('Da li ste sigurni da želite da ugasite ovaj tim?')) return;
        setError(null);
        try {
            await api.delete(`/Team/Disband-Team/${selectedTeam.teamId}`);
            setSelectedTeam(null);
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Greška pri gašenju tima.');
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const isCaptain = selectedTeam?.roleInTeam === 'Captain';
    const fullLogoUrl = selectedTeam?.logoUrl ? (selectedTeam.logoUrl.startsWith('http') ? selectedTeam.logoUrl : `${apiBaseUrl}${selectedTeam.logoUrl}`) : '';
    console.log("DEBUG: selectedTeam:", selectedTeam, "Full Logo URL:", fullLogoUrl);

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ direction: "row", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Moji timovi
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => { setShowCreateForm(true); setError(null); }}
                        disabled={showCreateForm}
                    >
                        Novi tim
                    </Button>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {inviteSuccess && <Alert severity="success" sx={{ mb: 3 }}>{inviteSuccess}</Alert>}

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card sx={{ borderRadius: 3, mb: 2 }}>
                            <CardContent sx={{ p: 0 }}>
                                <Typography variant="subtitle2" sx={{ p: 2, fontWeight: 700, bgcolor: '#f8fafc' }}>
                                    Tvoji angažmani
                                </Typography>
                                <Divider />
                                <List sx={{ p: 0 }}>
                                    {allTeams.map((t) => (
                                        <ListItem key={t.teamId} disablePadding>
                                            <ListItemButton
                                                selected={selectedTeam?.teamId === t.teamId && !showCreateForm}
                                                onClick={() => handleSelectTeam(t)}
                                            >
                                                <ListItemText
                                                    primary={t.teamName}
                                                    secondary={t.leagueName}
                                                    slotProps={{
                                                        primary: { sx: { fontWeight: 600, fontSize: '0.9rem' } }
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                    {allTeams.length === 0 && (
                                        <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }} color="text.secondary">
                                            Niste član nijednog tima.
                                        </Typography>
                                    )}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 9 }}>
                        {showCreateForm ? (
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Kreiranje tima za ligu</Typography>
                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <TextField
                                            label="Naziv tima"
                                            variant="outlined"
                                            value={newTeam.name}
                                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Grad"
                                            variant="outlined"
                                            value={newTeam.city}
                                            onChange={(e) => setNewTeam({ ...newTeam, city: e.target.value })}
                                            fullWidth
                                        />
                                        <FormControl fullWidth>
                                            <InputLabel>Izaberi takmičenje</InputLabel>
                                            <Select
                                                value={newTeam.leagueId}
                                                label="Izaberi takmičenje"
                                                onChange={(e) => setNewTeam({ ...newTeam, leagueId: e.target.value })}
                                            >
                                                {leagues.map(l => (
                                                    <MenuItem key={l.id} value={l.id}>
                                                        {l.name} ({l.matchType === 2 ? '3x3' : '5x5'})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            sx={{ fontWeight: 700, borderRadius: 2, py: 1.5 }}
                                            onClick={handleCreateTeam}
                                            disabled={!newTeam.name || !newTeam.leagueId}
                                        >
                                            Kreiraj i prijavi se
                                        </Button>
                                        <Button variant="text" onClick={() => setShowCreateForm(false)}>Otkaži</Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ) : selectedTeam ? (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, lg: isCaptain ? 8 : 12 }}>
                                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <CardContent>
                                            <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <Avatar
                                                    src={fullLogoUrl}
                                                    sx={{ width: 64, height: 64, border: '1px solid #eee' }}
                                                >
                                                    <GroupIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                                        {selectedTeam.teamName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {selectedTeam.leagueName}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={selectedTeam.roleInTeam === 'Captain' ? 'Kapiten' : 'Igrač'}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ ml: 'auto', fontWeight: 700 }}
                                                />
                                            </Stack>

                                            <Divider sx={{ my: 3 }} />

                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                                Roster tima
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                            <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                                            <TableCell sx={{ fontWeight: 700 }}>Uloga</TableCell>
                                                            {isCaptain && <TableCell align="right" sx={{ fontWeight: 700 }}>Akcije</TableCell>}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {roster.map((member) => (
                                                            <TableRow key={member.username}>
                                                                <TableCell sx={{ fontWeight: 600 }}>@{member.username}</TableCell>
                                                                <TableCell>{member.role === 'Captain' ? 'Kapiten' : 'Igrač'}</TableCell>
                                                                {isCaptain && (
                                                                    <TableCell align="right">
                                                                        <Button
                                                                            size="small"
                                                                            color="error"
                                                                            variant="text"
                                                                            disabled={member.username === user?.username}
                                                                            onClick={() => handleRemovePlayer(member.userId)}
                                                                        >
                                                                            Ukloni
                                                                        </Button>
                                                                    </TableCell>
                                                                )}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>

                                            {isCaptain && (
                                                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={handleDisbandTeam}
                                                    >
                                                        Ugasi tim
                                                    </Button>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {isCaptain && (
                                    <Grid size={{ xs: 12, lg: 4 }}>
                                        <Stack spacing={3}>
                                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                                <CardContent>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PhotoCameraIcon color="primary" /> Logo tima
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                        <Avatar
                                                            src={fullLogoUrl}
                                                            sx={{ width: 100, height: 100, border: '2px solid #1976d2' }}
                                                        >
                                                            <GroupIcon sx={{ fontSize: 50 }} />
                                                        </Avatar>
                                                        <Button
                                                            variant="outlined"
                                                            component="label"
                                                            disabled={uploading}
                                                            fullWidth
                                                            startIcon={uploading ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
                                                        >
                                                            Promeni logo
                                                            <input
                                                                hidden
                                                                accept="image/*"
                                                                type="file"
                                                                onChange={handleLogoUpload}
                                                            />
                                                        </Button>
                                                    </Box>
                                                </CardContent>
                                            </Card>

                                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                                <CardContent>
                                                    <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                                                        <PersonAddIcon sx={{ color: '#f59e0b' }} />
                                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                            Pozovi igrača
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        Pozovi slobodne igrače u svoj tim.
                                                    </Typography>
                                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <FormControl fullWidth size="small">
                                                            <InputLabel>Pretraži igrače</InputLabel>
                                                            <Select
                                                                value={invitePlayerId}
                                                                label="Pretraži igrače"
                                                                onChange={(e) => setInvitePlayerId(e.target.value)}
                                                            >
                                                                {availablePlayers.map(p => (
                                                                    <MenuItem key={p.id} value={p.id}>
                                                                        @{p.username} ({p.firstName} {p.lastName})
                                                                    </MenuItem>
                                                                ))}
                                                                {availablePlayers.length === 0 && (
                                                                    <MenuItem disabled>Nema dostupnih igrača</MenuItem>
                                                                )}
                                                            </Select>
                                                        </FormControl>
                                                        <Button
                                                            variant="outlined"
                                                            fullWidth
                                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                                            onClick={handleSendInvite}
                                                            disabled={!invitePlayerId}
                                                        >
                                                            Pošalji pozivnicu
                                                        </Button>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Stack>
                                    </Grid>
                                )}
                            </Grid>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 10 }}>
                                <Typography color="text.secondary">
                                    Izaberite tim sa leve strane ili napravite novi.
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}