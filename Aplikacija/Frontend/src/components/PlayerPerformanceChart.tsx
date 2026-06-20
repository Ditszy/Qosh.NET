import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';

export const PlayerPerformanceChart = ({ matches }: { matches: any[] }) => {
    console.log("Podaci u grafikonu:", matches);
    if (!matches) {
        return <Typography>Nema podataka o prethodnim utakmicama.</Typography>;
    }

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <LineChart
                dataset={matches}
                xAxis={[{ 
                    scaleType: 'band', 
                    dataKey: 'date', 
                    valueFormatter: (date) => new Date(date).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' })
                }]}
                series={[
                    { dataKey: 'points', curve: "linear", label: 'Poeni', color: '#1976d2', },
                    { dataKey: 'assists', curve: "linear", label: 'Asistencije', color: '#2e7d32' },
                    { dataKey: 'rebounds', curve: "linear", label: 'Skokovi', color: '#ed6c02' },
                ]}
            />
        </Box>
    );
};