import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
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
    Alert,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Avatar,
    Autocomplete,
    TextField,
    IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

export default function TeamProfilePage() {
    const { user } = useAuth();
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [roster, setRoster] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [invitePlayerId, setInvitePlayerId] = useState('');
    const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [editingJersey, setEditingJersey] = useState<number | null>(null);
    const [jerseyValue, setJerseyValue] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const profileRes = await api.get(`/User/${user?.id}/profile`);
            const teams = profileRes.data.teams || [];
            setAllTeams(teams);

            if (teams.length > 0 && !selectedTeam) {
                handleSelectTeam(teams[0]);
            } else if (selectedTeam) {
                const current = teams.find((t: any) => t.teamId === selectedTeam.teamId);
                if (current) setSelectedTeam(current);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTeam = async (team: any) => {
        setSelectedTeam(team);
        setError(null);
        setInviteSuccess(null);
        try {
            const rosterRes = await api.get(`/Team/Get-Team-Roster/${team.teamId}`);
            setRoster(rosterRes.data || []);

            if (team.roleInTeam === 'Captain') {
                const playersRes = await api.get(`/Invite/Get-Available-Players`, { params: { teamId: team.teamId } });
                setAvailablePlayers(playersRes.data || []);
            } else {
                setAvailablePlayers([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

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

    const handleTransferCaptaincy = async (newCaptainId: number) => {
        if (!window.confirm('Da li ste sigurni da želite da prenesete kapitensku traku?')) return;
        setError(null);
        setInviteSuccess(null);
        try {
            await api.patch(`/Team/Transfer-Captaincy/${selectedTeam.teamId}/${newCaptainId}`);
            setInviteSuccess('Kapitenska traka je uspešno prenesena!');
            handleSelectTeam({ ...selectedTeam, roleInTeam: 'Player' });
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Greška pri prenosu kapitenske trake.');
        }
    };

    const handleChangeJersey = async (memberUserId: number) => {
        const num = Number(jerseyValue);
        if (!num || num < 0 || num > 99) {
            setError('Broj dresa mora biti između 0 i 99.');
            return;
        }
        try {
            await api.post(`/Team/Change-Jersey-Number?teamId=${selectedTeam.teamId}&userId=${memberUserId}&jerseyNumber=${num}`);
            setEditingJersey(null);
            setJerseyValue('');
            handleSelectTeam(selectedTeam);
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Greška pri menjanju broja dresa.');
        }
    };

    const handleLeaveTeam = async () => {
        if (!window.confirm('Da li ste sigurni da želite da napustite tim?')) return;
        setError(null);
        setInviteSuccess(null);
        try {
            await api.post(`/Team/Leave-Team?teamId=${selectedTeam.teamId}`);
            setSelectedTeam(null);
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Greška pri napuštanju tima.');
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const isCaptain = selectedTeam?.roleInTeam === 'Captain';
    const fullLogoUrl = selectedTeam?.logoUrl ? (selectedTeam.logoUrl.startsWith('http') ? selectedTeam.logoUrl : `${apiBaseUrl}${selectedTeam.logoUrl}`) : '';

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Moji timovi
                    </Typography>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {inviteSuccess && <Alert severity="success" sx={{ mb: 3 }}>{inviteSuccess}</Alert>}

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card sx={{ borderRadius: 3, mb: 2 }}>
                            <CardContent sx={{ p: 0 }}>
                                <Typography variant="subtitle2" sx={{ p: 2, fontWeight: 700, bgcolor: 'action.hover' }}>
                                    Tvoji angažmani
                                </Typography>
                                <Divider />
                                <List sx={{ p: 0 }}>
                                    {allTeams.map((t) => (
                                        <ListItem key={t.teamId} disablePadding>
                                            <ListItemButton
                                                selected={selectedTeam?.teamId === t.teamId}
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
                        {selectedTeam ? (
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
                                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                            {isCaptain && <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>}
                                                            <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                                            <TableCell sx={{ fontWeight: 700 }}>Uloga</TableCell>
                                                            {isCaptain && <TableCell align="right" sx={{ fontWeight: 700 }}>Akcije</TableCell>}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {roster.map((member) => (
                                                            <TableRow key={member.username}>
                                                                {isCaptain && (
                                                                    <TableCell>
                                                                        {editingJersey === member.userId ? (
                                                                            <Stack sx={{ flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
                                                                                <TextField
                                                                                    size="small"
                                                                                    value={jerseyValue}
                                                                                    onChange={(e) => setJerseyValue(e.target.value)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') handleChangeJersey(member.userId);
                                                                                        if (e.key === 'Escape') { setEditingJersey(null); setJerseyValue(''); }
                                                                                    }}
                                                                                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', min: 0, max: 99, style: { width: 40, textAlign: 'center' } } }}
                                                                                    autoFocus
                                                                                    sx={{ '& .MuiInputBase-root': { height: 32 } }}
                                                                                />
                                                                                <IconButton size="small" color="primary" onClick={() => handleChangeJersey(member.userId)}><CheckIcon fontSize="small" /></IconButton>
                                                                                <IconButton size="small" onClick={() => { setEditingJersey(null); setJerseyValue(''); }}><CloseIcon fontSize="small" /></IconButton>
                                                                            </Stack>
                                                                        ) : (
                                                                            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
                                                                                <Typography sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                                                                    {member.jerseyNumber != null ? member.jerseyNumber : '—'}
                                                                                </Typography>
                                                                                <IconButton size="small" onClick={() => { setEditingJersey(member.userId); setJerseyValue(member.jerseyNumber != null ? String(member.jerseyNumber) : ''); }}>
                                                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                                                </IconButton>
                                                                            </Stack>
                                                                        )}
                                                                    </TableCell>
                                                                )}
                                                                <TableCell sx={{ fontWeight: 600 }}>
                                                                    {member.firstName || member.lastName
                                                                        ? `${member.firstName || ''} ${member.lastName || ''} (${member.username})`
                                                                        : `@${member.username}`}
                                                                </TableCell>
                                                                <TableCell>{member.role === 'Captain' ? 'Kapiten' : 'Igrač'}</TableCell>
                                                                {isCaptain && (
                                                                    <TableCell align="right">
                                                                        <Stack sx={{ flexDirection: 'row', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                            {member.role !== 'Captain' && (
                                                                                <Button
                                                                                    size="small"
                                                                                    color="primary"
                                                                                    variant="text"
                                                                                    startIcon={<SwapHorizIcon fontSize="small" />}
                                                                                    onClick={() => handleTransferCaptaincy(member.userId)}
                                                                                >
                                                                                    Kapiten
                                                                                </Button>
                                                                            )}
                                                                            <Button
                                                                                size="small"
                                                                                color="error"
                                                                                variant="text"
                                                                                disabled={member.username === user?.username}
                                                                                onClick={() => handleRemovePlayer(member.userId)}
                                                                            >
                                                                                Ukloni
                                                                            </Button>
                                                                        </Stack>
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
                                            {!isCaptain && (
                                                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={handleLeaveTeam}
                                                    >
                                                        Napusti tim
                                                    </Button>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {isCaptain && (
                                    <Grid size={{ xs: 12, lg: 4 }}>
                                        <Stack sx={{ gap: 3 }}>
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
                                                        <Autocomplete
                                                            options={availablePlayers}
                                                            getOptionLabel={(option) => `@${option.username} (${option.firstName || ''} ${option.lastName || ''})`}
                                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                                            onChange={(_, value) => setInvitePlayerId(value ? String(value.id) : '')}
                                                            renderInput={(params) => (
                                                                <TextField {...params} label="Pretraži igrače" placeholder="Unesite korisničko ime..." />
                                                            )}
                                                            noOptionsText="Nema pronađenih igrača"
                                                            fullWidth
                                                            size="small"
                                                        />
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
                                    Izaberite tim sa leve strane da biste videli detalje i upravljali timom.
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}