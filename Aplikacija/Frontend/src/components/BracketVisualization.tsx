import { Chip, Stack, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { matchStatusColor, matchStatusLabel } from '../utils/leagueFormat';
import { MatchStatus } from '../types';

export interface BracketMatch {
    id: number;
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

export interface BracketRound {
    title: string;
    matches: BracketMatch[];
}

interface BracketVisualizationProps {
    rounds: BracketRound[];
    isOrganizer?: boolean;
    onEditMatch?: (match: BracketMatch) => void;
}

const MatchCard = ({ match, isOrganizer, onEditMatch }: { match: BracketMatch; isOrganizer?: boolean; onEditMatch?: (match: BracketMatch) => void }) => (
    <Box
        sx={{
            backgroundColor: '#fff',
            border: '2px solid #1976d2',
            borderRadius: '6px',
            padding: '12px',
            minWidth: '200px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                borderColor: '#1565c0',
            },
        }}
    >
        <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {match.homeTeam}
                </Typography>
                {match.homeScore !== undefined && (
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', minWidth: '28px', textAlign: 'right', color: '#1976d2' }}>
                        {match.homeScore}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, paddingTop: '6px', borderTop: '1px solid #f0f0f0' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {match.awayTeam}
                </Typography>
                {match.awayScore !== undefined && (
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', minWidth: '28px', textAlign: 'right', color: '#1976d2' }}>
                        {match.awayScore}
                    </Typography>
                )}
            </Box>

            <Box sx={{ mt: 1 }}>
                <Chip label={matchStatusLabel(match.status)} color={matchStatusColor(match.status)} size="small" />
            </Box>

            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem' }}>
                {match.startTime}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                    component={RouterLink}
                    to={`/matches/${match.id}`}
                    size="small"
                    variant="text"
                    sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', paddingLeft: 0 }}
                >
                    Detalji
                </Button>
                {isOrganizer && (
                    <Button
                        size="small"
                        variant="text"
                        color="secondary"
                        onClick={() => onEditMatch?.(match)}
                        sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'none' }}
                    >
                        Izmeni
                    </Button>
                )}
            </Stack>
        </Stack>
    </Box>
);

export default function BracketVisualization({ rounds, isOrganizer, onEditMatch }: BracketVisualizationProps) {
    if (rounds.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Bracket još nije generisan.
            </Typography>
        );
    }

    const totalHeight = Math.max(300, Math.pow(2, rounds.length) * 80);
    const columnWidth = 240;
    const columnSpacing = 60;

    return (
        <Box sx={{ overflowX: 'auto', overflowY: 'auto', pb: 2 }}>
            <Box
                sx={{
                    position: 'relative',
                    minWidth: `${rounds.length * (columnWidth + columnSpacing) + 100}px`,
                    minHeight: `${totalHeight}px`,
                    p: 2,
                }}
            >
                {/* SVG za linije */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                    }}
                >
                    {rounds.map((round, roundIdx) => {
                        if (roundIdx === rounds.length - 1) return null;

                        const currentMatches = round.matches.length;
                        const nextMatches = rounds[roundIdx + 1].matches.length;
                        const matchHeight = totalHeight / currentMatches;
                        const nextMatchHeight = totalHeight / nextMatches;

                        return (
                            <g key={`lines-${roundIdx}`}>
                                {round.matches.map((_, matchIdx) => {
                                    const currentY = (matchIdx + 0.5) * matchHeight;
                                    const x1 = roundIdx * (columnWidth + columnSpacing) + columnWidth + 16;

                                    const nextMatchIdx = Math.floor(matchIdx / 2);
                                    const nextY = (nextMatchIdx + 0.5) * nextMatchHeight;
                                    const x2 = (roundIdx + 1) * (columnWidth + columnSpacing) + 16;

                                    return (
                                        <g key={`line-${roundIdx}-${matchIdx}`}>
                                            <line x1={x1} y1={currentY} x2={x1 + 20} y2={currentY} stroke="#1976d2" strokeWidth="2" />
                                            <line x1={x1 + 20} y1={currentY} x2={x1 + 20} y2={nextY} stroke="#1976d2" strokeWidth="2" />
                                            <line x1={x1 + 20} y1={nextY} x2={x2} y2={nextY} stroke="#1976d2" strokeWidth="2" />
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>

                {/* Match cards */}
                <Box
                    sx={{
                        display: 'flex',
                        position: 'relative',
                        zIndex: 1,
                        gap: `${columnSpacing}px`,
                    }}
                >
                    {rounds.map((round, roundIdx) => {
                        const matchHeight = totalHeight / round.matches.length;

                        return (
                            <Box key={`round-${roundIdx}`} sx={{ minWidth: columnWidth, position: 'relative' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#666', mb: 2, fontSize: '0.85rem' }}>
                                    {round.title}
                                </Typography>
                                <Box sx={{ position: 'relative', height: totalHeight }}>
                                    {round.matches.map((match, matchIdx) => {
                                        const topPosition = matchIdx * matchHeight + matchHeight / 2 - 50;

                                        return (
                                            <Box key={match.id} sx={{ position: 'absolute', top: `${topPosition}px`, left: 0, width: '100%' }}>
                                                <MatchCard match={match} isOrganizer={isOrganizer} onEditMatch={onEditMatch} />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}
