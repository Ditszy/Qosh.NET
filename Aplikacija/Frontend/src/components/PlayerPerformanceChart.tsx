import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';

export const PlayerPerformanceChart = ({ matches }: { matches: any[] }) => {
    const chartData = matches.map((match, index) => ({
        ...match,
        matchIndex: index + 1
    }));

    if (!matches) {
        return <Typography>Nema podataka o prethodnim utakmicama.</Typography>;
    }

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <LineChart
                dataset={chartData}
                xAxis={[{ 
                    scaleType: 'point',
                    dataKey: 'matchIndex', 
                    label: 'Redni broj utakmice',
                    tickMinStep: 1
                }]}
                series={[
                    { dataKey: 'points', curve: "linear", label: 'Poeni', color: '#1976d2' },
                    { dataKey: 'assists', curve: "linear", label: 'Asistencije', color: '#2e7d32' },
                    { dataKey: 'rebounds', curve: "linear", label: 'Skokovi', color: '#ed6c02' },
                ]}
            />
        </Box>
    );
};