import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Stack, Grow } from '@mui/material';
import { MatchStatus } from '../types';
import api from '../services/api';
import { useToast } from './ToastProvider';

interface VotingSectionProps {
    matchId: number;
    match: any;
}

const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

const VotingSection = ({ matchId, match }: VotingSectionProps) => {
    const { showToast } = useToast();
    const [hasVoted, setHasVoted] = useState(false);
    const [results, setResults] = useState<any>(null);
    const buttonStyle = (color: string) => ({
        backgroundColor: color,
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'transform 0.2s, filter 0.2s',
    })
    useEffect(() => {
    fetchResults();

    const checkVoteStatus = async () => {
        try {
            const response = await api.get(`/Vote/Has-Voted/${matchId}`);
            setHasVoted(response.data);
        } catch (err) {
            console.error("Greška pri proveri glasanja", err);
        }
    };
    checkVoteStatus();
}, [matchId]);

   const handleVote = async (teamId: number) => {
        try {
            console.log("Šaljem na server -> TeamId:", teamId);
            const response = await api.post('/Vote/Cast-Vote', { 
                matchId: matchId, 
                teamId: teamId 
            });

            setHasVoted(true);
            fetchResults();
        } catch (error: any) {
            console.error("Greška pri glasanju:", error.response?.data || error.message);
            
            const errorMessage = error.response?.data?.message || "Došlo je do greške pri glasanju.";
            showToast(`Greška: ${errorMessage}`, 'error');
        }
    };

        const fetchResults = async () => {
        try {
            const response = await api.get(`/Vote/Get-Votes/${matchId}`);
            console.log("Podaci iz API-ja:", response.data); 
            setResults(response.data);
        } catch (error) {
            console.error("Greška pri dohvatanju:", error);
        }
    };

    const isScheduled = match.status === MatchStatus.Scheduled;
   return (
    <Box sx={{ 
        mt: 2, 
        p: 2, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2, 
        bgcolor: 'background.paper',
        width: { xs: '90%', md: '50%' },
        mx: 'auto',
        minHeight: 200
    }}>
        {isScheduled && !hasVoted ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                    Glasajte za boljeg!
                </Typography>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', width: '100%' }}>
                    <Button variant="contained" color="primary" sx={{ flex: 1 }} onClick={() => handleVote(1)}>
                        {match.homeTeamName}
                    </Button>
                    <Button variant="contained" color="error" sx={{ flex: 1 }} onClick={() => handleVote(2)}>
                        {match.awayTeamName}
                    </Button>
                </Stack>
            </Box>
        ) : (
            <Box sx={{ width: '100%' }}>
                <Typography variant="h6" align="center" sx={{ mb: 2, color: 'text.primary' }}>
                    {isScheduled ? "Hvala na glasanju!" : "Rezultati glasanja:"}
                </Typography>

                {(() => {
                    const homeVotes = results?.find((r: any) => r.teamId === 1)?.count || 0;
                    const awayVotes = results?.find((r: any) => r.teamId === 2)?.count || 0;
                    const total = homeVotes + awayVotes;
                    const homePercent = total === 0 ? 50 : Math.round((homeVotes / total) * 100);
                    const awayPercent = 100 - homePercent;

                    return (
                        <Box sx={{ px: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {match.homeTeamName}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                    {match.awayTeamName}
                                </Typography>
                            </Box>

                            <Grow in={true} timeout={1000}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    height: '24px', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden', 
                                    bgcolor: 'action.disabledBackground',
                                    width: '100%' 
                                }}>
                                    <Box sx={{ 
                                        width: `${homePercent}%`, 
                                        bgcolor: 'primary.main', 
                                        transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }} />
                                    <Box sx={{ 
                                        width: `${awayPercent}%`, 
                                        bgcolor: 'error.main', 
                                        transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                                    }} />
                                </Box>
                            </Grow>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    {homePercent}%
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                    {awayPercent}%
                                </Typography>
                            </Box>
                            
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Ukupno glasova: {total}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })()}
            </Box>
        )}
    </Box>
);
};

export default VotingSection;