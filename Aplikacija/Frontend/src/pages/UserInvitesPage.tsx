import { useState } from 'react';
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
import MailIcon from '@mui/icons-material/Mail';
import Navbar from '../components/Navbar';

type InviteStatus = 'Pending' | 'Accepted' | 'Declined';

const initialInvites = [
    {
        id: 1,
        teamName: 'KK Marinos',
        sender: 'marko23',
        status: 'Pending' as InviteStatus,
        sentAt: '30.05.2026',
    },
    {
        id: 2,
        teamName: 'KK Andrija',
        sender: 'dule11',
        status: 'Accepted' as InviteStatus,
        sentAt: '28.05.2026',
    },
];

export default function UserInvitesPage() {
    const [invites, setInvites] = useState(initialInvites);

    const updateStatus = (inviteId: number, status: InviteStatus) => {
        setInvites((prev) =>
            prev.map((invite) =>
                invite.id === inviteId ? { ...invite, status } : invite
            )
        );
    };

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 8 }}>
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
                            {invites.map((invite) => (
                                <Card key={invite.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {invite.teamName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Poslao: @{invite.sender} • {invite.sentAt}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={invite.status}
                                                color={
                                                    invite.status === 'Accepted'
                                                        ? 'success'
                                                        : invite.status === 'Declined'
                                                            ? 'error'
                                                            : 'warning'
                                                }
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Stack>

                                        {invite.status === 'Pending' && (
                                            <Stack sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, mt: 2 }}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                    onClick={() => updateStatus(invite.id, 'Accepted')}
                                                >
                                                    Prihvati
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                    onClick={() => updateStatus(invite.id, 'Declined')}
                                                >
                                                    Odbij
                                                </Button>
                                            </Stack>
                                        )}
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
