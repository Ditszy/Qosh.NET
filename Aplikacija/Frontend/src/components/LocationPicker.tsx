import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export const LocationPicker = ({ 
    onLocationSelect,
    initialLat,
    initialLng
}: { 
    onLocationSelect: (lat: number, lng: number, address: string) => void,
    initialLat?: number,
    initialLng?: number
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);


  useEffect(() => {
    if (mapRef.current) return;

    const lat = initialLat || 43.32;
    const lng = initialLng || 21.89;
    
    const map = L.map('map-picker').setView([lat, lng], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) map.removeLayer(markerRef.current);
      markerRef.current = L.marker([lat, lng]).addTo(map);

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const data = await response.json();
        
        const addr = data.address;
        const shortAddress = [addr.road, addr.house_number, addr.city || addr.town].filter(Boolean).join(', ');
        
        onLocationSelect(lat, lng, shortAddress || data.display_name);
      } catch (err) {
        onLocationSelect(lat, lng, "Greška");
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div id="map-picker" style={{ height: '300px', width: '100%', marginBottom: '10px', borderRadius: '8px' }} />;
};