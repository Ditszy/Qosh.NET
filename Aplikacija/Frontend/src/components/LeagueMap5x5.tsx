import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { Typography } from '@mui/material';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import 'leaflet/dist/leaflet.css';

const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
        <div style="
            position: relative;
            width: 30px;
            height: 30px;
            background-color: #FB8F37;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        ">
            <div style="
                position: absolute;
                top: 7px;
                left: 7px;
                width: 12px;
                height: 12px;
                background-color: white;
                border-radius: 50%;
            "></div>
        </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});
L.Marker.prototype.options.icon = customIcon;

interface MatchLocation {
    id: number;
    startTime: string;
    latitude: number;
    longitude: number;
    homeTeamName: string;
    awayTeamName: string;
}

export const LeagueMap5x5 = ({ leagueId }: { leagueId: number }) => {
    const [matches, setMatches] = useState<MatchLocation[]>([]);

    useEffect(() => {
        if (leagueId) {
            api.get(`/Leagues/Upcoming-Matches-Locations/${leagueId}`)
               .then(res => setMatches(res.data))
               .catch(err => console.error("Greška pri učitavanju:", err));
        }
    }, [leagueId]);

    return (
        <>
            <style>{`

                .marker-cluster div {
                    width: 30px;
                    height: 30px;
                    margin-left: 5px;
                    margin-top: 5px;
                    text-align: center;
                    border-radius: 50%;
                    background-color: #FB8F37; /* Intenzivna narandžasta za broj */
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 8px rgba(0,0,0,0.2);
                }
            `}</style>

            <MapContainer center={[43.32, 21.89]} zoom={13} style={{ height: "400px", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                <MarkerClusterGroup>
                    {matches.map((m) => {
                        if (!m.latitude || !m.longitude) return null;

                        return (
                            <Marker key={m.id} position={[m.latitude, m.longitude]} icon={customIcon}>
                                <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
                                    <div style={{ textAlign: 'center', padding: '5px' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                            {m.homeTeamName} vs {m.awayTeamName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            {new Date(m.startTime).toLocaleDateString('sr-RS', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Typography>
                                    </div>
                                </Tooltip>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </>
    );
};