import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Grid,
    Avatar,
    Divider,
    CircularProgress,
    Chip,
    Button,
    Collapse,
    IconButton,
    Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { MatchType, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { matchTypeLabel, formatDate } from '../utils/leagueFormat';
import { PlayerPerformanceChart } from '../components/PlayerPerformanceChart';
import { useToast } from '../components/ToastProvider';

const apiBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

const StatTile = ({ label, value, color = 'text.primary' }: { label: string; value: number; color?: string }) => (
    <Box sx={{
        p: 1.5,
        bgcolor: 'action.hover',
        borderRadius: 2,
        textAlign: 'center'
    }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color, lineHeight: 1.2 }}>
            {value.toFixed(1)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {label}
        </Typography>
    </Box>
);

const getShootingColor = (label: string, pct: number): 'success' | 'warning' | 'error' => {
    switch (label) {
        case '3P%':
            return pct >= 40 ? 'success' : pct >= 30 ? 'warning' : 'error';
        case '2P%':
        case 'FG%':
            return pct >= 50 ? 'success' : pct >= 40 ? 'warning' : 'error';
        case 'FT%':
            return pct >= 80 ? 'success' : pct >= 70 ? 'warning' : 'error';
        default:
            return pct >= 50 ? 'success' : pct >= 35 ? 'warning' : 'error';
    }
};

const ShootingRow = ({ label, made, attempted, pct }: { label: string; made: number; attempted: number; pct: number }) => (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
            <Stack sx={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{made}/{attempted}</Typography>
                <Chip
                    label={`${pct.toFixed(1)}%`}
                    size="small"
                    color={getShootingColor(label, pct)}
                    sx={{ fontWeight: 800, minWidth: 56 }}
                />
            </Stack>
        </Stack>
    </Box>
);

const StatBlock = ({ title, data, icon }: { title: string; data: any; icon?: React.ReactNode }) => (
    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2.5 }}>
                {icon || <SportsBasketballIcon sx={{ color: 'primary.main' }} />}
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{title}</Typography>
            </Stack>
            {!data ? (
                <Typography variant="body2" color="text.secondary">Nema podataka za ovaj format.</Typography>
            ) : (
                <Stack sx={{ gap: 2 }}>
                    <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Mečeva</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{data.gamesPlayed}</Typography>
                    </Stack>

                    <Divider />

                    <Grid container spacing={1.5}>
                        <Grid size={{ xs: 4 }}><StatTile label="Poeni" value={data.avgPoints} color="primary.main" /></Grid>
                        <Grid size={{ xs: 4 }}><StatTile label="Skokovi" value={data.avgRebounds} /></Grid>
                        <Grid size={{ xs: 4 }}><StatTile label="Asistencije" value={data.avgAssists} /></Grid>
                        <Grid size={{ xs: 4 }}><StatTile label="Ukradene" value={data.avgSteals} /></Grid>
                        <Grid size={{ xs: 4 }}><StatTile label="Blokade" value={data.avgBlocks} /></Grid>
                        <Grid size={{ xs: 4 }}><StatTile label="Greške" value={data.avgFouls} color="error.main" /></Grid>
                    </Grid>

                    <Divider />

                    <Stack sx={{ gap: 1 }}>
                        <ShootingRow label="FG%" made={data.totalFieldGoalsMade} attempted={data.totalFieldGoalsAttempted} pct={data.fieldGoalPercentage} />
                        <ShootingRow label="2P%" made={data.totalTwoPointersMade} attempted={data.totalTwoPointersAttempted} pct={data.twoPointerPercentage} />
                        <ShootingRow label="3P%" made={data.totalThreePointersMade} attempted={data.totalThreePointersAttempted} pct={data.threePointerPercentage} />
                        <ShootingRow label="FT%" made={data.totalFreeThrowsMade} attempted={data.totalFreeThrowsAttempted} pct={data.freeThrowPercentage} />
                    </Stack>
                </Stack>
            )}
        </CardContent>
    </Card>
);

const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
    }
    return days;
};

const ActivityHeatmap = ({ matchHistory }: { matchHistory: any[] }) => {
    const last30Days = getLast30Days();

    const playedDates =
        matchHistory?.reduce((acc: Record<string, number>, match) => {
            if (!match.startTime) return acc;
            const dateStr = new Date(match.startTime).toISOString().split("T")[0];
            acc[dateStr] = (acc[dateStr] || 0) + 1;
            return acc;
        }, {}) || {};

    return (
        <Card
            sx={{
                borderRadius: 4,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, mb: 2, color: "text.primary" }}
                >
                    Aktivnost u poslednjih 30 dana
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(10, 1fr)",
                        gap: 1,
                        bgcolor: "primary.text",
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    {last30Days.map((date, index) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const gamesPlayed = playedDates[dateStr] || 0;

                        const getHeatmapStyles = (count: number) => {
                            if (count === 0)
                                return { bgcolor: "action.disabled", opacity: 0.25 };
                            if (count === 1)
                                return { bgcolor: "primary.light", opacity: 0.6 };
                            if (count === 2) return { bgcolor: "primary.light", opacity: 1 };
                            if (count === 3 || count === 4)
                                return { bgcolor: "primary.main", opacity: 0.8 };
                            return { bgcolor: "primary.main", opacity: 1 };
                        };

                        const styles = getHeatmapStyles(gamesPlayed);
                        const formattedDate = date.toLocaleDateString("sr-Latn-RS", {
                            day: "numeric",
                            month: "short",
                        });

                        const getMatchLabel = (count: number) => {
                            if (count === 1) return "1 meč";
                            if (count >= 2 && count <= 4) return `${count} meča`;
                            return `${count} mečeva`;
                        };

                        return (
                            <Tooltip
                                key={index}
                                title={`${formattedDate} • ${getMatchLabel(gamesPlayed)}`}
                                arrow
                                placement="top"
                                enterTouchDelay={0}
                            >
                                <Box
                                    sx={{
                                        width: "100%",
                                        aspectRatio: "1/1",
                                        borderRadius: 0.5,
                                        bgcolor: styles.bgcolor,
                                        opacity: styles.opacity,
                                        transition: "all 0.15s ease-in-out",
                                        cursor: "pointer",
                                        "&:hover": {
                                            transform: "scale(1.25)",
                                            opacity: 1,
                                            boxShadow:
                                                gamesPlayed > 0
                                                    ? "0 0 10px var(--mui-palette-primary-main)"
                                                    : "0 0 6px var(--mui-palette-text-secondary)",
                                            zIndex: 10,
                                        },
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 1,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        mt: 1.5,
                    }}
                >
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Manje
                    </Typography>
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            bgcolor: "action.disabled",
                            opacity: 0.25,
                            borderRadius: 0.5,
                        }}
                    />
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            bgcolor: "primary.light",
                            borderRadius: 0.5,
                        }}
                    />
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            bgcolor: "primary.main",
                            borderRadius: 0.5,
                        }}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Više
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default function PlayerProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, hasRole } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
    const [playerMatches, setPlayerMatches] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                api.get(`/User/${userId}/profile`),
                api.get(`/Statistics/Player-Stats/${userId}`)
            ]);
            setProfile(profileRes.data);
            setStats(statsRes.data);

            const last10Matches = profileRes.data.matchHistory
                ?.slice()
                .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .slice(0, 10)
                .reverse()

            setPlayerMatches(last10Matches || []);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleToggleStatus = async () => {
        try {
            const endpoint = profile.isActive ? 'Deactivate-User' : 'Activate-User';
            await api.put(`/Admin/${endpoint}`, { username: profile.username });
            fetchData();
        } catch (err) { showToast("Greška pri promeni statusa.", 'error'); }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const stats5x5 = stats?.statsByMatchType?.find((s: any) => s.matchType === MatchType.Classic_5x5);
    const stats3x3 = stats?.statsByMatchType?.find((s: any) => s.matchType === MatchType.Basket_3X3);

    const fullProfilePicUrl = profile?.profilePictureUrl ? (profile.profilePictureUrl.startsWith('http') ? profile.profilePictureUrl : `${apiBaseUrl}${profile.profilePictureUrl}`) : '';

    const getMatchOutcome = (m: any) => {
        if (m.matchStatus !== 'Finished') return null;
        const isHome = profile?.teams?.some((t: any) => {
            const leagueId = t.leagueId;
            return leagueId;
        });
        const playerScore = m.homeScore;
        const opponentScore = m.awayScore;
        if (m.points !== undefined && (m.homeScore != null && m.awayScore != null)) {
            return null;
        }
        return null;
    };

    const getShootingPct = (made: number, attempted: number) => {
        if (attempted === 0) return '0.0';
        return ((made / attempted) * 100).toFixed(1);
    };

    const getMatchDate = (startTime: string) => {
        return formatDate(startTime);
    };

    const getMatchTime = (startTime: string) => {
        const d = new Date(startTime);
        return d.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Grid container spacing={4}>
                    {/* Profile Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 4, textAlign: 'center', p: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                            <Avatar
                                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '3rem' }}
                                src={fullProfilePicUrl}
                            >
                                {profile?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>{profile?.firstName} {profile?.lastName}</Typography>
                            <Typography variant="body1" color="text.secondary">@{profile?.username}</Typography>
                            <Chip label={profile?.globalRole} size="small" color="primary" sx={{ mt: 1, fontWeight: 700 }} />
                            <Chip
                                label={profile?.isActive ? 'Aktivan' : 'Neaktivan'}
                                size="small"
                                color={profile?.isActive ? 'success' : 'error'}
                                variant="outlined"
                                sx={{ mt: 1, ml: 0.5, fontWeight: 700 }}
                            />

                            {hasRole(UserRole.Admin) && profile?.globalRole?.toLowerCase() !== 'admin' && !profile?.isActive && (
                                <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
                                    <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 700, mb: 1 }}>Admin Akcije</Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        color="success"
                                        size="small"
                                        onClick={handleToggleStatus}
                                    >
                                        Aktiviraj korisnika
                                    </Button>
                                </Box>
                            )}

                            <Divider sx={{ my: 3 }} />

                            <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>Timovi:</Typography>
                                    <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {profile?.teams?.filter((t: any) => t.isActiveInTeam).map((t: any) => (
                                            <Chip key={t.teamId} label={t.teamName} size="small" variant="outlined" />
                                        ))}
                                        {(!profile?.teams || profile.teams.filter((t: any) => t.isActiveInTeam).length === 0) && <Typography variant="body2">Nema tima</Typography>}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Card>

                        <Card sx={{ borderRadius: 4, mt: 4, mb: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                            <ActivityHeatmap matchHistory={profile?.matchHistory} />
                        </Card>

                        <Card sx={{ borderRadius: 4, mt: 4, mb: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Forma igrača (poslednjih 10 utakmica)</Typography>
                                <PlayerPerformanceChart matches={playerMatches} />
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Statistika igrača</Typography>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StatBlock
                                    title={`${matchTypeLabel(MatchType.Classic_5x5)} Prosek`}
                                    data={stats5x5}
                                    icon={<SportsBasketballIcon sx={{ color: 'primary.main' }} />}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <StatBlock
                                    title={`${matchTypeLabel(MatchType.Basket_3X3)} Prosek`}
                                    data={stats3x3}
                                    icon={<SportsBasketballIcon sx={{ color: 'secondary.main' }} />}
                                />
                            </Grid>
                        </Grid>

                        <Card sx={{ borderRadius: 4, mt: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                    <EmojiEventsIcon sx={{ color: 'warning.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Istorija mečeva</Typography>
                                    <Chip label={profile?.matchHistory?.length || 0} size="small" sx={{ fontWeight: 700 }} />
                                </Stack>

                                <Stack sx={{ gap: 1.5 }}>
                                    {profile?.matchHistory?.map((m: any) => {
                                        const isExpanded = expandedMatch === m.matchId;
                                        const totalFgMade = m.twoPointersMade + m.threePointersMade;
                                        const totalFgAttempted = m.twoPointersAttempted + m.threePointersAttempted;

                                        return (
                                            <Card
                                                key={m.matchId}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' }
                                                }}
                                                onClick={() => setExpandedMatch(isExpanded ? null : m.matchId)}
                                            >
                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                                        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.5, flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: 0 }}>
                                                            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                                    {getMatchDate(m.startTime)}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                    {getMatchTime(m.startTime)}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 100, sm: 'none' } }}>{m.homeTeamName}</Typography>
                                                                    {m.homeScore != null && m.awayScore != null ? (
                                                                        <Chip
                                                                            label={`${m.homeScore} - ${m.awayScore}`}
                                                                            size="small"
                                                                            color={m.matchStatus === 'Finished' ? 'secondary' : 'default'}
                                                                            sx={{ fontWeight: 800, minWidth: 65 }}
                                                                        />
                                                                    ) : (
                                                                        <Chip label="vs" size="small" variant="outlined" />
                                                                    )}
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 100, sm: 'none' } }}>{m.awayTeamName}</Typography>
                                                                </Stack>
                                                            </Box>
                                                        </Stack>
                                                        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                                            <Chip
                                                                label={m.matchStatus === 'Finished' ? 'Završen' : m.matchStatus === 'Live' ? 'Uživo' : 'Zakazan'}
                                                                size="small"
                                                                color={m.matchStatus === 'Finished' ? 'success' : m.matchStatus === 'Live' ? 'error' : 'default'}
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); setExpandedMatch(isExpanded ? null : m.matchId); }}
                                                            >
                                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                            </IconButton>
                                                        </Stack>
                                                    </Stack>

                                                    <Stack sx={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                                                        {[
                                                            { label: 'PTS', value: m.points },
                                                            { label: 'REB', value: m.rebounds },
                                                            { label: 'AST', value: m.assists },
                                                            { label: 'STL', value: m.steals },
                                                            { label: 'BLK', value: m.blocks },
                                                        ].map((stat) => (
                                                            <Chip
                                                                key={stat.label}
                                                                label={`${stat.label} ${stat.value}`}
                                                                size="small"
                                                                variant={stat.value > 0 ? 'filled' : 'outlined'}
                                                                color={stat.value > 0 ? 'primary' : 'default'}
                                                                sx={{ fontWeight: 700, height: 24 }}
                                                            />
                                                        ))}
                                                    </Stack>

                                                    {/* Collapse */}
                                                    <Collapse in={isExpanded} timeout="auto">
                                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }} onClick={(e) => e.stopPropagation()}>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
                                                                Detalji šuta
                                                            </Typography>
                                                            <Grid container spacing={1}>
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>FG</Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                            {totalFgMade}/{totalFgAttempted}
                                                                        </Typography>
                                                                        <Chip label={`${getShootingPct(totalFgMade, totalFgAttempted)}%`} size="small" color={getShootingColor('FG%', parseFloat(getShootingPct(totalFgMade, totalFgAttempted)))} sx={{ fontWeight: 800, mt: 0.5 }} />
                                                                    </Box>
                                                                </Grid>
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>2P</Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                            {m.twoPointersMade}/{m.twoPointersAttempted}
                                                                        </Typography>
                                                                        <Chip label={`${getShootingPct(m.twoPointersMade, m.twoPointersAttempted)}%`} size="small" color={getShootingColor('2P%', parseFloat(getShootingPct(m.twoPointersMade, m.twoPointersAttempted)))} sx={{ fontWeight: 800, mt: 0.5 }} />
                                                                    </Box>
                                                                </Grid>
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>3P</Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                            {m.threePointersMade}/{m.threePointersAttempted}
                                                                        </Typography>
                                                                        <Chip label={`${getShootingPct(m.threePointersMade, m.threePointersAttempted)}%`} size="small" color={getShootingColor('3P%', parseFloat(getShootingPct(m.threePointersMade, m.threePointersAttempted)))} sx={{ fontWeight: 800, mt: 0.5 }} />
                                                                    </Box>
                                                                </Grid>
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>FT</Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                            {m.freeThrowsMade}/{m.freeThrowsAttempted}
                                                                        </Typography>
                                                                        <Chip label={`${getShootingPct(m.freeThrowsMade, m.freeThrowsAttempted)}%`} size="small" color={getShootingColor('FT%', parseFloat(getShootingPct(m.freeThrowsMade, m.freeThrowsAttempted)))} sx={{ fontWeight: 800, mt: 0.5 }} />
                                                                    </Box>
                                                                </Grid>
                                                            </Grid>

                                                            <Stack sx={{ flexDirection: 'row', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                                                                <Chip label={`Lične: ${m.fouls}`} size="small" variant="outlined" />
                                                                <Chip label={`Skokovi: ${m.rebounds}`} size="small" variant="outlined" />
                                                                <Chip label={`Ukradene: ${m.steals}`} size="small" variant="outlined" />
                                                                <Chip label={`Blokade: ${m.blocks}`} size="small" variant="outlined" />
                                                            </Stack>

                                                            <Button
                                                                size="small"
                                                                sx={{ mt: 1.5, fontWeight: 700, textTransform: 'none' }}
                                                                onClick={() => navigate(`/matches/${m.matchId}`)}
                                                            >
                                                                Pogledaj ceo meč →
                                                            </Button>
                                                        </Box>
                                                    </Collapse>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                    {(!profile?.matchHistory || profile.matchHistory.length === 0) && (
                                        <Box sx={{ textAlign: 'center', py: 6 }}>
                                            <SportsBasketballIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                                            <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                Nema odigranih mečeva.
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
