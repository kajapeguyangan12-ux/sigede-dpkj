'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon - use local paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Tile provider - OpenStreetMap (default)
const TILE_LAYER = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  minZoom: 3,
};

interface LeafletMapViewerProps {
  location: string; // Format: "lat, lng"
  title: string;
  address?: string;
}

export default function LeafletMapViewer({ location, title, address }: LeafletMapViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const [position, setPosition] = useState<[number, number]>([-8.6726408, 115.1880418]);

  useEffect(() => {
    setIsClient(true);
    
    // Parse location string to coordinates
    if (location) {
      console.log('Location data received:', location);
      const coords = location.split(',').map(coord => parseFloat(coord.trim()));
      console.log('Parsed coordinates:', coords);
      
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const newPosition: [number, number] = [coords[0], coords[1]];
        console.log('Setting position to:', newPosition);
        setPosition(newPosition);
      } else {
        console.warn('Invalid coordinates:', location);
      }
    } else {
      console.warn('No location data provided');
    }
  }, [location]);

  if (!isClient) {
    return (
      <div className="w-full h-[300px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 font-medium">Memuat peta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] rounded-2xl overflow-hidden shadow-lg ring-2 ring-gray-200">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        inertia={false}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
      >
        <TileLayer
          attribution={TILE_LAYER.attribution}
          url={TILE_LAYER.url}
          maxZoom={TILE_LAYER.maxZoom}
          minZoom={TILE_LAYER.minZoom}
        />
        <Marker position={position}>
          <Popup>
            <div className="text-center p-1">
              <div className="font-bold text-gray-800 mb-1">{title}</div>
              {address && <div className="text-xs text-gray-600">{address}</div>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
