import { useState } from 'react';
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
    Paper
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Navbar from '../components/Navbar';

const teamData = {
    name: 'KK Marinos',
    city: 'Niš',
    league: 'Letnja 3x3 Liga',
    status: 'Potvrđen',
    members: [
        { id: 1, name: 'Marko Jović', role: 'Kapiten', status: 'Potvrđen' },
        { id: 2, name: 'Dušan Ilić', role: 'Igrač', status: 'Potvrđen' },
        { id: 3, name: 'Nikola Savić', role: 'Igrač', status: 'Na čekanju' },
    ],
};

export default function TeamProfilePage() {
    const [newTeam, setNewTeam] = useState({
        name: '',
        city: '',
        league: '',
    });
    const [inviteUsername, setInviteUsername] = useState('');

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Moj tim
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Kreiraj tim, prati roster i upravljaj pozivnicama za igrače.
                    </Typography>
                </Stack>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <GroupIcon sx={{ color: '#1976d2' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        Profil tima
                                    </Typography>
                                    <Chip label={teamData.status} size="small" color="success" sx={{ ml: 'auto', fontWeight: 700 }} />
                                </Stack>

                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {teamData.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {teamData.city} • {teamData.league}
                                </Typography>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                    Roster
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Ime</TableCell>
                                                <TableCell>Uloga</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Akcije</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {teamData.members.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell>{member.name}</TableCell>
                                                    <TableCell>{member.role}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={member.status}
                                                            size="small"
                                                            color={member.status === 'Potvrđen' ? 'success' : 'warning'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            variant="text"
                                                            disabled={member.role === 'Kapiten'}
                                                        >
                                                            Ukloni
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                        Kreiranje tima
                                    </Typography>
                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField
                                            label="Naziv tima"
                                            value={newTeam.name}
                                            onChange={(event) => setNewTeam({ ...newTeam, name: event.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Grad"
                                            value={newTeam.city}
                                            onChange={(event) => setNewTeam({ ...newTeam, city: event.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Primarna liga"
                                            value={newTeam.league}
                                            onChange={(event) => setNewTeam({ ...newTeam, league: event.target.value })}
                                            fullWidth
                                        />
                                        <Button variant="contained" sx={{ fontWeight: 700, borderRadius: 2 }}>
                                            Kreiraj
                                        </Button>
                                    </Stack>
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
                                    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField
                                            label="Korisničko ime igrača"
                                            value={inviteUsername}
                                            onChange={(event) => setInviteUsername(event.target.value)}
                                            fullWidth
                                        />
                                        <Button variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }}>
                                            Pošalji poziv
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
