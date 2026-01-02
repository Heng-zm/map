
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { GeolocateControl, Marker } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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
  const marker = useRef<Marker | null>(null);
  const { toast } = useToast();

  const [locationDetails, setLocationDetails] = useState<{lng: number, lat: number} | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

    mapInstance.addControl(geolocate, 'bottom-right');

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
    
    const onMapClick = (e: mapboxgl.MapMouseEvent & {
      features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
    }) => {
      if (marker.current) {
        marker.current.remove();
      }
      
      const newMarker = new Marker().setLngLat(e.lngLat).addTo(mapInstance);
      marker.current = newMarker;

      setLocationDetails(e.lngLat);
      setIsDrawerOpen(true);
    };

    mapInstance.on('style.load', onStyleLoad);
    mapInstance.on('click', onMapClick);

    return () => {
      mapInstance.off('style.load', onStyleLoad);
      mapInstance.off('click', onMapClick);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }
  }, [toast]);

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    setLocationDetails(null);
  };


  return (
    <div className="h-screen w-screen overflow-hidden bg-background font-body dark">
        <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
        <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && handleDrawerClose()}>
          <SheetContent side="bottom" className="rounded-t-lg">
            <SheetHeader>
              <SheetTitle>Location Details</SheetTitle>
              <SheetDescription>
                Details about the selected point on the map.
              </SheetDescription>
            </SheetHeader>
            {locationDetails && (
              <div className="py-4">
                <p><strong>Latitude:</strong> {locationDetails.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {locationDetails.lng.toFixed(6)}</p>
              </div>
            )}
          </SheetContent>
        </Sheet>
    </div>
  );
}
