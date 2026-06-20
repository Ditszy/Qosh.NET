import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const LeagueMap = ({ lat, lng, name }: { lat: number, lng: number, name: string }) => {
    return (
        <MapContainer center={[lat, lng]} zoom={15} style={{ height: '300px', width: '100%', borderRadius: '16px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]}>
                <Popup>{name}</Popup>
            </Marker>
        </MapContainer>
    );
};