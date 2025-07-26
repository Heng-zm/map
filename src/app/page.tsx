
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Download, RotateCw } from 'lucide-react';

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
  const [isRotating, setIsRotating] = useState(false);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!mapboxgl.accessToken) {
        toast({
            variant: "destructive",
            title: "โทเค็น Mapbox ไม่ได้ตั้งค่า",
            description: "โปรดระบุโทเค็น Mapbox ในตัวแปรสภาพแวดล้อมของคุณ",
        });
        return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: initialCenter,
      zoom: initialZoom,
      pitch: 60,
      bearing: 0,
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
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);
  
  const rotateCamera = (timestamp: number) => {
      if (!map.current) return;
      //-360 to reverse direction
      map.current.rotateTo((timestamp / 100) % 360, { duration: 0 });
      animationFrameId.current = requestAnimationFrame(rotateCamera);
  }

  const handleToggleRotation = () => {
    if (isRotating) {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    } else {
        animationFrameId.current = requestAnimationFrame(rotateCamera);
    }
    setIsRotating(!isRotating);
  };
  

  const handleDownloadMap = () => {
    if (!map.current || !mapContainer.current) return;

    const mapInstance = map.current;
    const container = mapContainer.current;

    const mapCanvas = mapInstance.getCanvas();
    const originalWidth = mapCanvas.clientWidth;
    const originalHeight = mapCanvas.clientHeight;
    
    const targetResolution = 3000;
    const scale = targetResolution / Math.max(originalWidth, originalHeight);
    
    const newWidth = originalWidth * scale;
    const newHeight = originalHeight * scale;

    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;
    mapInstance.resize();

    mapInstance.once('idle', () => {
      const dataURL = mapInstance.getCanvas().toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'map-high-quality.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      container.style.width = `${originalWidth}px`;
      container.style.height = `${originalHeight}px`;
      mapInstance.resize();
    });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-body dark">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <div className="absolute top-4 right-4 flex gap-2">
        <Button onClick={handleToggleRotation} size="icon" variant={isRotating ? "secondary" : "default"}>
          <RotateCw className={isRotating ? 'animate-spin' : ''}/>
        </Button>
        <Button onClick={handleDownloadMap} size="icon">
          <Download />
        </Button>
      </div>
    </div>
  );
}
