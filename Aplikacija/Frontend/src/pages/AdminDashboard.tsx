import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BlockIcon from '@mui/icons-material/Block';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { LocationPicker } from '../components/LocationPicker';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmProvider';
import { formatDateTime } from '../utils/leagueFormat';

interface AdminLogEntry {
    id: number;
    action: string;
    details: string;
    adminUsername: string;
    timestamp: string;
}

export default function AdminDashboard() {
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [officialForm, setOfficialForm] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 2
    });

    const [deactivateUsername, setDeactivateUsername] = useState('');
    const [logs, setLogs] = useState<AdminLogEntry[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AdminLogEntry | null>(null);

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await api.get('/Admin/Get-System-Logs');
            setLogs(res.data);
        } catch {
            showToast("Greška pri učitavanju logova.", 'error');
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const [leagueForm, setLeagueForm] = useState({
        name: '',
        season: new Date().getFullYear().toString(),
        matchType: 2,
        maxTeams: '12',
        entryFee: '0',
        registrationDeadline: '',
        startDate: '',
        description: '',
        location: '',
        isPublic: true
    });

    const handleCreateOfficial = async () => {
        try {
            await api.post(`/Admin/Create-Official-Account/${officialForm.role}`, {
                username: officialForm.username,
                email: officialForm.email,
                password: officialForm.password,
                firstName: officialForm.firstName,
                lastName: officialForm.lastName
            });
            showToast("Službeni nalog uspešno kreiran!", 'success');
            setOfficialForm({
                username: '',
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                role: 2
            });
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri kreiranju naloga.", 'error');
        }
    };

    const handleDeactivateUser = async () => {
        if (!deactivateUsername) return showToast("Unesite korisničko ime.", 'warning');
        if (!(await confirm({ message: `Da li ste sigurni da želite da DEAKTIVIRATE korisnika ${deactivateUsername}?`, confirmText: 'Deaktiviraj', severity: 'error' }))) return;

        try {
            await api.put(`/Admin/Deactivate-User`, { username: deactivateUsername });
            showToast(`Korisnik ${deactivateUsername} je uspešno deaktiviran.`, 'success');
            setDeactivateUsername('');
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri deaktivaciji.", 'error');
        }
    };

    const handleCreateLeague = async () => {
        if (!leagueForm.name || !leagueForm.registrationDeadline) return showToast("Popunite osnovna polja za ligu.", 'warning');
        try {
            await api.post('/Leagues/Create-League', {
                ...leagueForm,
                maxTeams: Number(leagueForm.maxTeams),
                entryFee: Number(leagueForm.entryFee)
            });
            showToast("Takmičenje uspešno kreirano!", 'success');
            setLeagueForm({
                name: '',
                season: new Date().getFullYear().toString(),
                matchType: 2,
                maxTeams: '12',
                entryFee: '0',
                registrationDeadline: '',
                startDate: '',
                description: '',
                location: '',
                isPublic: true
            });
        } catch (err: any) {
            showToast(err.response?.data || "Greška pri kreiranju takmičenja.", 'error');
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 6 }}>
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: 'transparent' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: '-0.02em' }}>
                        Admin Panel
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Centralizovano upravljanje korisnicima i globalnim podešavanjima takmičenja.
                    </Typography>
                </Paper>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>

                    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                                    <PersonAddIcon />
                                </Avatar>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    Kreiraj Službeni Nalog
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField
                                        label="Ime"
                                        variant="filled"
                                        value={officialForm.firstName}
                                        onChange={(e) => setOfficialForm({ ...officialForm, firstName: e.target.value })}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Prezime"
                                        variant="filled"
                                        value={officialForm.lastName}
                                        onChange={(e) => setOfficialForm({ ...officialForm, lastName: e.target.value })}
                                        fullWidth
                                    />
                                </Box>
                                <TextField
                                    label="Korisničko ime"
                                    variant="filled"
                                    value={officialForm.username}
                                    onChange={(e) => setOfficialForm({ ...officialForm, username: e.target.value })}
                                    fullWidth
                                />
                                <TextField
                                    label="Email adresa"
                                    variant="filled"
                                    value={officialForm.email}
                                    onChange={(e) => setOfficialForm({ ...officialForm, email: e.target.value })}
                                    fullWidth
                                />
                                <TextField
                                    label="Privremena lozinka"
                                    variant="filled"
                                    type="password"
                                    value={officialForm.password}
                                    onChange={(e) => setOfficialForm({ ...officialForm, password: e.target.value })}
                                    fullWidth
                                />
                                <FormControl fullWidth variant="filled">
                                    <InputLabel>Sistemska uloga</InputLabel>
                                    <Select
                                        value={officialForm.role}
                                        label="Sistemska uloga"
                                        onChange={(e) => setOfficialForm({ ...officialForm, role: e.target.value as number })}
                                    >
                                        <MenuItem value={2}>Organizator</MenuItem>
                                        <MenuItem value={3}>Sudija</MenuItem>
                                        <MenuItem value={4}>Zapisničar</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleCreateOfficial}
                                    sx={{ borderRadius: 2, py: 2, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
                                >
                                    Generiši Nalog
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Ovo mozda i izbacim nije neophodno toliko */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>

                        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #fee2e2', flex: 1 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Avatar sx={{ bgcolor: '#fee2e2', color: '#ef4444' }}>
                                        <BlockIcon />
                                    </Avatar>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#b91c1c' }}>
                                        Deaktivacija naloga
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Ručno deaktivirajte bilo koji korisnički nalog. Ovo onemogućava prijavu, ali čuva njihove podatke u sistemu.
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Korisničko ime"
                                        error
                                        size="small"
                                        placeholder="Unesite korisničko ime za blokadu"
                                        value={deactivateUsername}
                                        onChange={(e) => setDeactivateUsername(e.target.value)}
                                        fullWidth
                                    />
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleDeactivateUser}
                                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                                    >
                                        Deaktiviraj Korisnika
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', flex: 1 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: '#f3f4f6', color: '#374151' }}>
                                            <HistoryIcon />
                                        </Avatar>
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                            Sistemski Audit
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={fetchLogs} disabled={logsLoading}>
                                        <RefreshIcon />
                                    </IconButton>
                                </Box>
                                {logsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress size={32} />
                                    </Box>
                                ) : logs.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                        Nema zabeleženih aktivnosti.
                                    </Typography>
                                ) : (
                                    <TableContainer sx={{ maxHeight: 400 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700 }}>Vreme</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Akcija</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Korisnik</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Detalji</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {logs.map((log) => (
                                                    <TableRow
                                                        key={log.id}
                                                        hover
                                                        onClick={() => setSelectedLog(log)}
                                                        sx={{ cursor: 'pointer' }}
                                                    >
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                            {formatDateTime(log.timestamp)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={log.action} size="small" color="primary" variant="outlined" />
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.85rem' }}>
                                                            {log.adminUsername}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.85rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {log.details}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', gridColumn: { md: 'span 2' } }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a' }}>
                                    <EmojiEventsIcon />
                                </Avatar>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    Kreiranje Globalnog Takmičenja
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 8' } }}>
                                    <TextField label="Naziv lige" value={leagueForm.name} onChange={(e) => setLeagueForm({ ...leagueForm, name: e.target.value })} fullWidth />
                                </Box>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                                    <TextField label="Sezona" value={leagueForm.season} onChange={(e) => setLeagueForm({ ...leagueForm, season: e.target.value })} fullWidth />
                                </Box>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Format</InputLabel>
                                        <Select value={leagueForm.matchType} label="Format" onChange={(e) => setLeagueForm({ ...leagueForm, matchType: e.target.value as number })}>
                                            <MenuItem value={1}>Košarka (5x5)</MenuItem>
                                            <MenuItem value={2}>Basket (3x3)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                    <TextField label="Maksimalno timova" value={leagueForm.maxTeams} onChange={(e) => setLeagueForm({ ...leagueForm, maxTeams: e.target.value })} fullWidth slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', min: 2, max: 100 } }} />
                                </Box>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                    <TextField label="Kotizacija" value={leagueForm.entryFee} onChange={(e) => setLeagueForm({ ...leagueForm, entryFee: e.target.value })} fullWidth slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', min: 0 } }} />
                                </Box>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                    <TextField label="Rok za prijavu" type="datetime-local" value={leagueForm.registrationDeadline} onChange={(e) => setLeagueForm({ ...leagueForm, registrationDeadline: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                                </Box>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                    <TextField label="Početak" type="datetime-local" value={leagueForm.startDate} onChange={(e) => setLeagueForm({ ...leagueForm, startDate: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                                </Box>
                                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                                    <TextField label="Lokacija" value={leagueForm.location} onChange={(e) => setLeagueForm({ ...leagueForm, location: e.target.value })} placeholder="npr. Beograd, Srbija" fullWidth />
                                </Box>
                                <Box sx={{ gridColumn: 'span 12' }}>
                                    <TextField label="Opis takmičenja" multiline rows={3} value={leagueForm.description} onChange={(e) => setLeagueForm({ ...leagueForm, description: e.target.value })} fullWidth />
                                </Box>
                                {leagueForm.matchType === 2 && (
                                    <Box sx={{ gridColumn: 'span 12' }}>
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
                                <Box sx={{ gridColumn: 'span 12' }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleCreateLeague}
                                        sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 2, py: 2, fontWeight: 700, mt: 1 }}
                                    >
                                        Pokreni Takmičenje
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                </Box>
            </Container>

            <Dialog
                open={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                maxWidth="sm"
                fullWidth
            >
                {selectedLog && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>
                            {selectedLog.action}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary">Vreme</Typography>
                                <Typography variant="body1">{formatDateTime(selectedLog.timestamp)}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary">Izvršilac</Typography>
                                <Typography variant="body1">{selectedLog.adminUsername}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Detalji</Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedLog.details}</Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedLog(null)}>Zatvori</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}