import { useMemo, useState } from 'react';
import {
    Box,
    Stack,
    Typography,
    Tabs,
    Tab,
    Card,
    CardContent,
    Chip,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { matchStatusColor, matchStatusLabel } from '../utils/leagueFormat';
import { MatchStatus } from '../types';

export interface RoundRobinMatch {
    id: number;
    round: number;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    startTime: string;
    status: MatchStatus;
    location?: string;
    refereeId?: number;
    refereeName?: string;
    scorerId?: number;
    scorerName?: string;
}

export interface RoundRobinStanding {
    id: number;
    team: string;
    played: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    points: number;
}

export interface RoundRobinData {
    standings: RoundRobinStanding[];
    matches: RoundRobinMatch[];
}

interface RoundRobinViewProps {
    data: RoundRobinData;
    isOrganizer?: boolean;
    onEditMatch?: (match: RoundRobinMatch) => void;
}

export default function RoundRobinView({ data, isOrganizer, onEditMatch }: RoundRobinViewProps) {
    const [tabValue, setTabValue] = useState(0);

    const matchesByRound = useMemo(() => {
        const map = new Map<number, RoundRobinMatch[]>();
        data.matches.forEach((match) => {
            if (!map.has(match.round)) {
                map.set(match.round, []);
            }
            map.get(match.round)!.push(match);
        });

        return Array.from(map.entries())
            .sort(([a], [b]) => a - b)
            .map(([round, matches]) => ({
                round,
                matches,
            }));
    }, [data.matches]);

    return (
        <Stack spacing={3}>
            <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{
                    borderBottom: '2px solid #e0e0e0',
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                    },
                }}
            >
                <Tab label="Tabela stanja" />
                <Tab label="Kompletan raspored" />
            </Tabs>

            {tabValue === 0 && (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    U
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    P
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    N
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    Koševi
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    Poeni
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.standings.map((row) => (
                                <TableRow
                                    key={row.id}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: '#f9f9f9',
                                        },
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 600 }}>{row.team}</TableCell>
                                    <TableCell align="center">{row.played}</TableCell>
                                    <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                        {row.wins}
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: '#f44336', fontWeight: 600 }}>
                                        {row.losses}
                                    </TableCell>
                                    <TableCell align="center">
                                        {row.pointsFor}:{row.pointsAgainst}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                                        {row.points}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {tabValue === 1 && (
                <Stack spacing={3}>
                    {matchesByRound.map((round) => (
                        <Box key={round.round}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                Kolo {round.round}
                                <Chip
                                    label={`${round.matches.length} mečeva`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Typography>

                            <Stack spacing={2}>
                                {round.matches.map((match) => (
                                    <Card
                                        key={match.id}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                borderColor: '#1976d2',
                                            },
                                        }}
                                    >
                                        <CardContent>
                                            <Stack
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={2}
                                                sx={{
                                                    justifyContent: 'space-between',
                                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                                }}
                                            >
                                                <Stack spacing={0.5} sx={{ flex: 1 }}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.95rem',
                                                            }}
                                                        >
                                                            {match.homeTeam}
                                                        </Typography>
                                                        {match.homeScore !== undefined && (
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: '1.1rem',
                                                                    color: '#1976d2',
                                                                    minWidth: '32px',
                                                                    textAlign: 'right',
                                                                }}
                                                            >
                                                                {match.homeScore}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.95rem',
                                                            }}
                                                        >
                                                            {match.awayTeam}
                                                        </Typography>
                                                        {match.awayScore !== undefined && (
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: '1.1rem',
                                                                    color: '#1976d2',
                                                                    minWidth: '32px',
                                                                    textAlign: 'right',
                                                                }}
                                                            >
                                                                {match.awayScore}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Stack>

                                                <Stack
                                                    direction={{ xs: 'column', sm: 'row' }}
                                                    spacing={1.5}
                                                    sx={{
                                                        alignItems: { xs: 'flex-start', sm: 'center' },
                                                        width: { xs: '100%', sm: 'auto' },
                                                    }}
                                                >
                                                    <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ fontSize: '0.8rem' }}
                                                        >
                                                            {match.startTime}
                                                        </Typography>
                                                        <Chip
                                                            label={matchStatusLabel(match.status)}
                                                            color={matchStatusColor(match.status)}
                                                            size="small"
                                                        />
                                                    </Stack>

                                                    <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                                        <Button
                                                            component={RouterLink}
                                                            to={`/matches/${match.id}`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.8rem',
                                                                textTransform: 'none',
                                                                flex: 1
                                                            }}
                                                        >
                                                            Detalji
                                                        </Button>
                                                        {isOrganizer && (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="secondary"
                                                                onClick={() => onEditMatch?.(match)}
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: '0.8rem',
                                                                    textTransform: 'none',
                                                                    flex: 1
                                                                }}
                                                            >
                                                                Izmeni
                                                            </Button>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
