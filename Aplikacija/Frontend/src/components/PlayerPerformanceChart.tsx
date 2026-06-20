import { useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { Box, Typography, Stack, Button } from '@mui/material';

export const PlayerPerformanceChart = ({ matches }: { matches: any[] }) => {

    
    const [activeChart, setActiveChart] = useState<'line' | 'fg' | 'radar'>('line');

    if (!matches || matches.length === 0) {
        return <Typography>Nema podataka o prethodnim utakmicama.</Typography>;
    }

    const chartData = matches.map((match, index) => {
        const totalMade = (match.twoPointersMade || 0) + (match.threePointersMade || 0);
        const totalAttempted = (match.twoPointersAttempted || 0) + (match.threePointersAttempted || 0);
        const fgPct = totalAttempted > 0 ? Number(((totalMade / totalAttempted) * 100).toFixed(1)) : 0;
        const pir = match.points + match.rebounds + match.steals + match.assists + match.blocks 
        - (totalAttempted - totalMade) - (match.freeThrowsAttempted - match.freeThrowsMade) - match.fouls;

        return {
            ...match,
            matchIndex: index + 1,
            fgA: totalAttempted,
            fgM: totalMade,
            fgPercentage: fgPct,
            pir: pir
            };
    });

    const radar = {
        metrics: ['Pts.', 'Ast.', 'Blk.', 'Rbd.', 'Stl.'],
        };

        const playerSeries = [
        {
            id: 'player-stats',
            data: [
                chartData.reduce((acc, m) => acc + (m.points || 0), 0) / chartData.length,
                chartData.reduce((acc, m) => acc + (m.assists || 0), 0) / chartData.length,
                chartData.reduce((acc, m) => acc + (m.blocks || 0), 0) / chartData.length,
                chartData.reduce((acc, m) => acc + (m.rebounds || 0), 0) / chartData.length,
                chartData.reduce((acc, m) => acc + (m.steals || 0), 0) / chartData.length,
            ],
        },
        ];

    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'center' }}>
                <Button 
                    variant={activeChart === 'line' ? 'contained' : 'outlined'} 
                    onClick={() => setActiveChart('line')}
                >
                    Forma
                </Button>
                <Button 
                    variant={activeChart === 'fg' ? 'contained' : 'outlined'} 
                    onClick={() => setActiveChart('fg')}
                >
                    Šut
                </Button>
                <Button 
                    variant={activeChart === 'radar' ? 'contained' : 'outlined'} 
                    onClick={() => setActiveChart('radar')}
                >
                    Player DNA
                </Button>
            </Stack>

            <Box sx={{ height: 300, width: '100%' }}>
                
                {activeChart === 'line' && (
                    <LineChart
                        dataset={chartData}
                        xAxis={[{ scaleType: 'point', dataKey: 'matchIndex', label: 'Redni broj utakmice' }]}
                        series={[
                            { dataKey: 'points', curve: "linear", label: 'Poeni', color: '#1976d2' },
                            { dataKey: 'assists', curve: "linear", label: 'Asistencije', color: '#2e7d32' },
                            { dataKey: 'blocks', curve: "linear", label: 'Blokade', color: '#ed6c02' },
                            { dataKey: 'pir', curve: "linear", label: 'PIR', color: '#9c27b0' }
                        ]}
                    />
                )}

                {activeChart === 'fg' && (
                    <BarChart
                        dataset={chartData}
                        xAxis={[{ scaleType: 'band', dataKey: 'matchIndex', label: 'Utakmica' }]}
                        series={[
                            { dataKey: 'fgA', label: 'Pokušani', color: '#ed6c02' },
                            { dataKey: 'fgM', label: 'Pogodjeni', color: '#2e7d32' },
                        ]}
                        height={300}
                    />
            )}

                {activeChart === 'radar' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                       <RadarChart
                            height={300}
                            series={[
                                {
                                data: playerSeries[0].data,
                                color: '#ed6c02',
                                fillArea: true,
                                },
                            ]}
                            radar={radar}
                        />
                    </Box>
                )}

            </Box>
        </Box>
    );
};