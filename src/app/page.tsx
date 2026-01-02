
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { GeolocateControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;

const mapStyle = 'mapbox://styles/mapbox/standard';

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
            description: "Please provide your Mapbox token in your environment variables.",
        });
        return;
    }

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      preserveDrawingBuffer: true,
    });
    map.current = mapInstance;

    const geolocate = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserLocation: true
    });

    mapInstance.addControl(geolocate);

    mapInstance.on('load', () => {
      geolocate.trigger();
    });

    const onStyleLoad = () => {
      if(!map.current) return;
      if (map.current.getSource('mapbox-dem')) {
          map.current.setTerrain(null);
      } else {
          map.current.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 14
          });
          map.current.setTerrain(null);
      }
    };

    mapInstance.on('style.load', onStyleLoad);

    return () => {
      mapInstance.off('style.load', onStyleLoad);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }
  }, [toast]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background font-body dark">
        <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
    </div>
  );
}
