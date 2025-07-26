
'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { TrafficCone, Ruler } from 'lucide-react';
import { lineString, featureCollection } from '@turf/helpers';
import length from '@turf/length';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;
const initialStyle = 'mapbox://styles/mapbox/standard';

const emptyGeoJSON = {
    type: 'FeatureCollection' as const,
    features: []
};

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [showTraffic, setShowTraffic] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [distance, setDistance] = useState(0);
  const [measurementPoints, setMeasurementPoints] = useState<mapboxgl.LngLat[]>([]);


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
      
      map.current?.addSource('measurement', {
        type: 'geojson',
        data: emptyGeoJSON
      });
      map.current?.addLayer({
        id: 'measurement-points',
        type: 'circle',
        source: 'measurement',
        paint: {
            'circle-radius': 5,
            'circle-color': '#000',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        },
        filter: ['in', '$type', 'Point']
      });
      map.current?.addLayer({
        id: 'measurement-lines',
        type: 'line',
        source: 'measurement',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#000',
            'line-width': 2.5
        },
        filter: ['in', '$type', 'LineString']
      });

    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);

  useEffect(() => {
    if (!map.current) return;
    if (showTraffic) {
      map.current.setConfigProperty('basemap', 'showTraffic', true);
    } else {
      map.current.setConfigProperty('basemap', 'showTraffic', false);
    }
  }, [showTraffic, map]);

  const handleMapClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    if (!isMeasuring || !map.current) return;
    const newPoints = [...measurementPoints, e.lngLat];
    setMeasurementPoints(newPoints);

    const features = newPoints.map(p => ({
        type: 'Feature' as const,
        geometry: {
            type: 'Point' as const,
            coordinates: [p.lng, p.lat]
        },
        properties: {}
    }));

    if (newPoints.length > 1) {
        const line = lineString(newPoints.map(p => [p.lng, p.lat]));
        features.push(line);
        const calculatedDistance = length(line, { units: 'kilometers' });
        setDistance(calculatedDistance);
    } else {
        setDistance(0);
    }
    
    const source = map.current.getSource('measurement') as mapboxgl.GeoJSONSource;
    if (source) {
        source.setData(featureCollection(features));
    }
  }, [isMeasuring, measurementPoints]);

  useEffect(() => {
    if (!map.current) return;

    if (isMeasuring) {
        map.current.getCanvas().style.cursor = 'crosshair';
        map.current.on('click', handleMapClick);
    } else {
        map.current.getCanvas().style.cursor = '';
        map.current.off('click', handleMapClick);
    }
    
    return () => {
        if(map.current) {
            map.current.getCanvas().style.cursor = '';
            map.current.off('click', handleMapClick);
        }
    }
  }, [isMeasuring, handleMapClick]);
  
  const clearMeasurement = useCallback(() => {
    setMeasurementPoints([]);
    setDistance(0);
    if (map.current) {
        const source = map.current.getSource('measurement') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(emptyGeoJSON);
        }
    }
  }, []);

  const toggleTraffic = () => {
    setShowTraffic(prev => !prev);
  }

  const toggleMeasurement = () => {
    setIsMeasuring(prev => {
        if (prev) {
            clearMeasurement();
        }
        return !prev;
    });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <div className="absolute top-24 left-2.5 z-10 flex flex-col gap-2">
        <Button
            size="icon"
            onClick={toggleTraffic}
            variant={showTraffic ? 'secondary': 'outline'}
            className="bg-white/75 text-black backdrop-blur-sm transition-all hover:bg-white"
            aria-label="Toggle traffic"
        >
            <TrafficCone className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          onClick={toggleMeasurement}
          variant={isMeasuring ? 'secondary' : 'outline'}
          className="bg-white/75 text-black backdrop-blur-sm transition-all hover:bg-white"
          aria-label="Measure distance"
        >
          <Ruler className="h-5 w-5" />
        </Button>
      </div>

       {isMeasuring && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/75 backdrop-blur-sm p-2 rounded-lg shadow-md flex items-center gap-4">
            <p className="font-semibold text-sm">
                Distance: {distance.toFixed(2)} km
            </p>
             <Button
                size="sm"
                variant="destructive"
                onClick={clearMeasurement}
             >
                Clear
            </Button>
        </div>
      )}
    </div>
  );
}
