
'use client';
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [-73.9876, 40.7484];
const initialZoom = 13;
const initialStyle = 'mapbox://styles/mapbox/standard';

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!mapboxgl.accessToken) {
        toast({
            variant: "destructive",
            title: "Mapbox token not set",
            description: "Please provide a Mapbox access token in your environment variables.",
        });
        return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 45,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');
    
    map.current.on('style.load', () => {
      if (map.current?.getSource('mapbox-dem')) {
        map.current?.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
      }
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
    </div>
  );
}
