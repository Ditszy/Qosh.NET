import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    TextField,
    InputAdornment,
    Divider,
    Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import Navbar from '../components/Navbar';

// Podaci za test
const Matches_test = [
    { id: 1, homeTeam: 'KK Marinos', awayTeam: 'KK Andrija', score: '74 : 72', status: 'U toku' },
    { id: 2, homeTeam: 'KK Vucina', awayTeam: 'KK Sicevo', score: '42 : 50', status: 'Poluvreme' },
];

const Tournaments_test = [
    { id: 101, name: 'Opasan neki turnir', format: '3x3', status: 'Prijave Otvorene' },
    { id: 102, name: 'Liga nesto kao', format: '5v5', status: 'U Toku' },
];

export default function LandingPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Box sx={{ bgcolor: '#111827', color: 'white', py: { xs: 6, md: 10 }, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <Container maxWidth="md">
                    <Typography variant="h3" component="h1" sx={{ fontWeight: '800', mb: 2, fontSize: { xs: '2.3rem', md: '3.5rem' } }}>
                        Neki tekst ne znam
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 4, color: '#9ca3af', fontWeight: '400', maxWidth: '600px', mx: 'auto' }}>
                        I ovde treba kao neki tekst da stoji.
                    </Typography>

                    <Box sx={{ maxWidth: 500, mx: 'auto', bgcolor: 'white', borderRadius: 3, p: 0.5, boxShadow: 3 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Pretraži lige, timove ili igrače..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { border: 'none' } } }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" sx={{ ml: 1 }} />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />
                    </Box>
                </Container>
            </Box>

            {/* Grid raspored */}
            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Grid container spacing={4}>

                    {/* Live mecevi */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 2 }}>
                                    <LiveTvIcon sx={{ color: '#ef4444' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Uživo utakmice</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />

                                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {Matches_test.map((match) => (
                                        <Box key={match.id} sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 2, borderLeft: '4px solid #ef4444' }}>
                                            <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                                <Chip label={match.status} size="small" color="error" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>ID: #{match.id}</Typography>
                                            </Stack>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>{match.homeTeam}</Typography>
                                            <Typography variant="h5" sx={{ my: 1, fontWeight: '900', color: '#1976d2', textAlign: 'center', letterSpacing: 2 }}>
                                                {match.score}
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>{match.awayTeam}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Aktivno trenutno */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 2 }}>
                                    <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Aktivna Takmičenja</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />

                                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {Tournaments_test.map((tournament) => (
                                        <Box key={tournament.id} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                            <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tournament.name}</Typography>
                                                <Chip label={tournament.format} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                                            </Stack>
                                            <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: tournament.status === 'Prijave Otvorene' ? '#10b981' : '#f59e0b',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ● {tournament.status}
                                                </Typography>
                                                <Button size="small" variant="text" sx={{ fontWeight: 'bold' }}>Pregledaj</Button>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                </Grid>
            </Container>
        </Box>
    );
}