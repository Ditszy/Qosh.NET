import { Box, Container, Grid, Typography} from '@mui/material';

const Footer = () => {
    return (
        <Box sx={{ bgcolor: '#121212', color: 'white', py: 6, flex: 'none',alignSelf: 'auto'}}>
    <Container maxWidth="lg">
        <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" sx={{ color: '#A78BFA', fontWeight: 700 }}>Qosh</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'grey.400' }}>
                    Platforma za organizaciju amaterskih košarkaških liga i timova. 
                </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Kontakt</Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>Email: vuk.zivkovic@elfak.rs</Typography>
            </Grid>
        </Grid>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 5, color: 'grey.600', pt: 2, borderTop: '1px solid #333' }}>
            © {new Date().getFullYear()} Qosh. Sva prava zadržana.
        </Typography>
    </Container>
</Box>
    );
};

export default Footer;