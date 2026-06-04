import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    Divider,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import Navbar from '../components/Navbar';
import { MatchStatus } from '../types';
import { matchStatusLabel, matchStatusColor } from '../utils/leagueFormat';

// Nije povezano sa API
const mockMatches: Record<number, any> = {
    1: {
        id: 1,
        leagueName: 'Premier League 3x3',
        homeTeam: 'Partizan',
        awayTeam: 'Crvena Zvezda',
        homeScore: 45,
        awayScore: 42,
        status: MatchStatus.Finished,
        startTime: '2024-06-15 18:00',
        location: 'Sportska Hala Pionir',
        referee: 'Marko Marković',
        scorer: 'Ana Anić',
        homeRoster: [
            { id: 1, name: 'Nemanja Jović', points: 15, fouls: 2, rebounds: 5, assists: 2 },
            { id: 2, name: 'Miloš Mitrović', points: 18, fouls: 1, rebounds: 8, assists: 3 },
            { id: 3, name: 'Stefan Stefanović', points: 12, fouls: 3, rebounds: 3, assists: 1 },
        ],
        awayRoster: [
            { id: 4, name: 'Vuk Vučević', points: 20, fouls: 2, rebounds: 6, assists: 2 },
            { id: 5, name: 'Luka Lukić', points: 15, fouls: 1, rebounds: 4, assists: 4 },
            { id: 6, name: 'Jovan Jovanović', points: 7, fouls: 3, rebounds: 2, assists: 1 },
        ],
    },
    2: {
        id: 2,
        leagueName: 'Classic League 5x5',
        homeTeam: 'OKK Beograd',
        awayTeam: 'FK Voždovac',
        homeScore: undefined,
        awayScore: undefined,
        status: MatchStatus.Scheduled,
        startTime: '2024-06-16 20:00',
        location: 'Sajam Dom Sportova',
        referee: 'Petar Petrović',
        scorer: 'Marija Marjanović',
        homeRoster: [
            { id: 7, name: 'Aleksandar Aleksandrović', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 8, name: 'Branko Branković', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 9, name: 'Goran Goranović', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 10, name: 'Dragan Draganović', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 11, name: 'Saša Šašić', points: 0, fouls: 0, rebounds: 0, assists: 0 },
        ],
        awayRoster: [
            { id: 12, name: 'Nikola Nikolić', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 13, name: 'Dejan Dejanović', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 14, name: 'Filip Filipović', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 15, name: 'Zvonko Zvonković', points: 0, fouls: 0, rebounds: 0, assists: 0 },
            { id: 16, name: 'Radomir Radomirović', points: 0, fouls: 0, rebounds: 0, assists: 0 },
        ],
    },
    204: {
        id: 204,
        leagueName: 'Letnja 3x3 Liga',
        homeTeam: 'KK Marinos',
        awayTeam: 'KK Andrija',
        homeScore: 46,
        awayScore: 42,
        status: MatchStatus.Live,
        startTime: '31.05.2026 • 18:00',
        location: 'SC Čair',
        referee: 'Milan Jovanović',
        scorer: 'Jelena Nikolić',
        homeRoster: [
            { id: 1, name: 'Marko Jović', points: 14, fouls: 2, rebounds: 4, assists: 3 },
            { id: 2, name: 'Dušan Ilić', points: 12, fouls: 1, rebounds: 5, assists: 2 },
            { id: 3, name: 'Nikola Savić', points: 8, fouls: 3, rebounds: 2, assists: 4 },
        ],
        awayRoster: [
            { id: 4, name: 'Luka Pavić', points: 15, fouls: 2, rebounds: 6, assists: 1 },
            { id: 5, name: 'Miloš Petrović', points: 11, fouls: 1, rebounds: 3, assists: 3 },
            { id: 6, name: 'Stefan Ristić', points: 6, fouls: 4, rebounds: 2, assists: 2 },
        ],
    },
};

export default function MatchDetails() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const numericId = Number(matchId);
    const match = mockMatches[numericId];

    if (!match) {
        return (
            <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
                <Navbar />
                <Container maxWidth="md" sx={{ mt: 6 }}>
                    <Button
                        startIcon={<ArrowBackIosNewIcon />}
                        onClick={() => navigate(-1)}
                        sx={{ mb: 3 }}
                    >
                        Nazad
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Meč nije pronađen.
                    </Typography>
                </Container>
            </Box>
        );
    }

    const homeTeamStats = match.homeRoster.reduce(
        (acc: any, player: any) => ({
            totalPoints: acc.totalPoints + player.points,
            totalRebounds: acc.totalRebounds + player.rebounds,
            totalAssists: acc.totalAssists + player.assists,
            totalFouls: acc.totalFouls + player.fouls,
        }),
        { totalPoints: 0, totalRebounds: 0, totalAssists: 0, totalFouls: 0 }
    );

    const awayTeamStats = match.awayRoster.reduce(
        (acc: any, player: any) => ({
            totalPoints: acc.totalPoints + player.points,
            totalRebounds: acc.totalRebounds + player.rebounds,
            totalAssists: acc.totalAssists + player.assists,
            totalFouls: acc.totalFouls + player.fouls,
        }),
        { totalPoints: 0, totalRebounds: 0, totalAssists: 0, totalFouls: 0 }
    );

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Button
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3 }}
                >
                    Nazad
                </Button>

                <Card sx={{ borderRadius: 3, mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {match.leagueName}
                        </Typography>

                        <Grid container spacing={3} sx={{ alignItems: 'center', my: 1 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Stack spacing={0.5} sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1976d2' }}>
                                        {match.homeTeam}
                                    </Typography>
                                    {match.homeScore !== undefined && (
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                            {match.homeScore}
                                        </Typography>
                                    )}
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Stack spacing={1} sx={{ textAlign: 'center' }}>
                                    <Chip
                                        label={matchStatusLabel(match.status)}
                                        color={matchStatusColor(match.status)}
                                        sx={{ alignSelf: 'center' }}
                                    />
                                    {match.homeScore !== undefined && match.awayScore !== undefined && (
                                        <Typography variant="body2" color="text.secondary">
                                            Završen meč
                                        </Typography>
                                    )}
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Stack spacing={0.5} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#f44336' }}>
                                        {match.awayTeam}
                                    </Typography>
                                    {match.awayScore !== undefined && (
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                            {match.awayScore}
                                        </Typography>
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <AccessTimeIcon sx={{ color: '#1976d2' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Vreme
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'center' }}>
                                        {match.startTime}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <LocationOnIcon sx={{ color: '#f59e0b' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Lokacija
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
                                        {match.location}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <PeopleIcon sx={{ color: '#4caf50' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Sudija
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {match.referee}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                    <PeopleIcon sx={{ color: '#9c27b0' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Rezultat
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {match.scorer}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                        {match.homeTeam}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />

                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Pts
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Reb
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Ast
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Fls
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {match.homeRoster.map((player: any) => (
                                                <TableRow key={player.id}>
                                                    <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                                                    <TableCell align="center">{player.points}</TableCell>
                                                    <TableCell align="center">{player.rebounds}</TableCell>
                                                    <TableCell align="center">{player.assists}</TableCell>
                                                    <TableCell align="center">{player.fouls}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ backgroundColor: '#f9f9f9', fontWeight: 700 }}>
                                                <TableCell sx={{ fontWeight: 700 }}>UKUPNO</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {homeTeamStats.totalPoints}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {homeTeamStats.totalRebounds}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {homeTeamStats.totalAssists}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {homeTeamStats.totalFouls}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f44336' }}>
                                        {match.awayTeam}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />

                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Igrač</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Pts
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Reb
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Ast
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    Fls
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {match.awayRoster.map((player: any) => (
                                                <TableRow key={player.id}>
                                                    <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                                                    <TableCell align="center">{player.points}</TableCell>
                                                    <TableCell align="center">{player.rebounds}</TableCell>
                                                    <TableCell align="center">{player.assists}</TableCell>
                                                    <TableCell align="center">{player.fouls}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ backgroundColor: '#f9f9f9', fontWeight: 700 }}>
                                                <TableCell sx={{ fontWeight: 700 }}>UKUPNO</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {awayTeamStats.totalPoints}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {awayTeamStats.totalRebounds}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {awayTeamStats.totalAssists}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                                    {awayTeamStats.totalFouls}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
