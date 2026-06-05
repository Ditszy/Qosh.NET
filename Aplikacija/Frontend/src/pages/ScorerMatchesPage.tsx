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
    Divider
} from '@mui/material';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import Navbar from '../components/Navbar';
import { MatchStatus } from '../types';
import { matchStatusColor, matchStatusLabel } from '../utils/leagueFormat';

const assignedMatches = [
    {
        id: 204,
        league: 'Letnja 3x3 Liga',
        homeTeam: 'KK Marinos',
        awayTeam: 'KK Andrija',
        startTime: '31.05.2026 • 18:00',
        status: MatchStatus.Live,
    },
    {
        id: 208,
        league: 'Gradska 5x5 Liga',
        homeTeam: 'KK Zvezda',
        awayTeam: 'KK Partizan',
        startTime: '02.06.2026 • 20:00',
        status: MatchStatus.Scheduled,
    },
];

export default function ScorerMatchesPage() {
    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Zapisničar — Moji mečevi
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upravljaj utakmicama koje su ti dodeljene i otvori zapisnik kada meč počne.
                    </Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                            <SportsScoreIcon sx={{ color: '#1976d2' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Dodeljene utakmice
                            </Typography>
                        </Stack>
                        <Divider sx={{ mb: 3 }} />

                        <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {assignedMatches.map((match) => (
                                <Card key={match.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {match.homeTeam} vs {match.awayTeam}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {match.league} • {match.startTime}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={matchStatusLabel(match.status)}
                                                color={matchStatusColor(match.status)}
                                                size="small"
                                            />
                                        </Stack>

                                        <Box sx={{ mt: 2 }}>
                                            <Button
                                                component={RouterLink}
                                                to={`/scorer/matches/${match.id}`}
                                                variant="contained"
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                Otvori zapisnik
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}
