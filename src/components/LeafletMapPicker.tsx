'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface LeafletMapPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: LocationData) => void;
}

// Component for handling map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMapPicker({ initialLocation, onLocationSelect }: LeafletMapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [-8.6726408, 115.1880418]
  );
  const [isClient, setIsClient] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debounced geocoding untuk performance
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    
    // Clear previous timeout
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
    }

    // Set koordinat dulu (instant), alamat menyusul
    onLocationSelect({
      lat: parseFloat(lat.toFixed(7)),
      lng: parseFloat(lng.toFixed(7)),
      address: 'Mengambil alamat...'
    });

    // Debounce geocoding request
    geocodingTimeoutRef.current = setTimeout(async () => {
      if (isGeocoding) return; // Prevent multiple requests
      
      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'id',
            }
          }
        );
        
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(7)}, ${lng.toFixed(7)}`;
        
        onLocationSelect({
          lat: parseFloat(lat.toFixed(7)),
          lng: parseFloat(lng.toFixed(7)),
          address
        });
      } catch (error) {
        console.error('Error getting address:', error);
        onLocationSelect({
          lat: parseFloat(lat.toFixed(7)),
          lng: parseFloat(lng.toFixed(7)),
          address: `${lat.toFixed(7)}, ${lng.toFixed(7)}`
        });
      } finally {
        setIsGeocoding(false);
      }
    }, 500); // Wait 500ms after last move
  }, [onLocationSelect, isGeocoding]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true}
        inertia={false}
        inertiaDeceleration={Infinity}
        inertiaMaxSpeed={Infinity}
        easeLinearity={1}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        worldCopyJump={false}
      >
        <TileLayer
          attribution={TILE_LAYER.attribution}
          url={TILE_LAYER.url}
          maxZoom={TILE_LAYER.maxZoom}
          minZoom={TILE_LAYER.minZoom}
          updateWhenIdle={false}
          updateWhenZooming={true}
          keepBuffer={2}
        />
        <MapClickHandler onLocationSelect={handleMapClick} />
        <Marker 
          position={position} 
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              handleMapClick(pos.lat, pos.lng);
            }
          }} 
        />
      </MapContainer>
    </div>
  );
}
