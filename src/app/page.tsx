
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;


export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!mapboxgl.accessToken) {
        toast({
            variant: "destructive",
            title: "โทខេน Mapbox មិនត្រូវបានកំណត់ទេ",
            description: "សូមផ្ដល់โทខេน Mapbox នៅក្នុងអថេរបរិស្ថានរបស់អ្នក។",
        });
        return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: initialCenter,
      zoom: initialZoom,
      preserveDrawingBuffer: true,
    });
    
    map.current.on('style.load', () => {
      if(!map.current) return;

      if (!map.current.getSource('mapbox-dem')) {
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
      }
      map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

      // Request user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.setCenter([longitude, latitude]);
          },
          () => {
            toast({
              title: "ការចូលដំណើរការទីតាំងត្រូវបានបដិសេធ",
              description: "កំពុងបង្ហាញទីតាំងលំនាំដើម។",
            });
          }
        );
      }
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);

  const handleDownloadMap = () => {
    if (map.current) {
      const dataURL = map.current.getCanvas().toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'map.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-body dark">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <div className="absolute top-4 right-4">
        <Button onClick={handleDownloadMap} size="icon">
          <Download />
        </Button>
      </div>
    </div>
  );
}
