import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    Button,
    Divider,
    CircularProgress
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserInvitesPage() {
    const { user } = useAuth();
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvites = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Invite/Get-My-Invites');
            setInvites(response.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchInvites();
    }, [user]);

    const handleRespond = async (inviteId: number, accept: boolean) => {
        try {
            await api.post(`/Invite/Respond-To-Invite?inviteId=${inviteId}&accept=${accept}`, {});
            fetchInvites();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
            <Navbar />

            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Pozivnice
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upravljaj pozivnicama za priključenje timu.
                    </Typography>
                </Stack>

                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2 }}>
                            <MailIcon sx={{ color: '#1976d2' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Pristigle pozivnice
                            </Typography>
                        </Stack>
                        <Divider sx={{ mb: 3 }} />

                        <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {invites.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    Nemate novih pozivnica.
                                </Typography>
                            )}
                            {invites.map((invite) => (
                                <Card key={invite.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {invite.teamName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Poslao: @{invite.senderUsername} • {new Date(invite.sentAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={invite.status}
                                                color="warning"
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Stack>

                                        <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, mt: 2 }}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                                onClick={() => handleRespond(invite.id, true)}
                                            >
                                                Prihvati
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                                onClick={() => handleRespond(invite.id, false)}
                                            >
                                                Odbij
                                            </Button>
                                        </Stack>
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
