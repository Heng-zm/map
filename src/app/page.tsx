
'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { TrafficCone, Ruler, Layers } from 'lucide-react';
import { lineString, polygon, featureCollection, point as turfPoint } from '@turf/helpers';
import length from '@turf/length';
import area from '@turf/area';
import distance from '@turf/distance';
import { MapStyleControl, type MapStyle } from '@/components/map-style-control';


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;

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
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [measurementPoints, setMeasurementPoints] = useState<mapboxgl.LngLat[]>([]);
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [showStyleControl, setShowStyleControl] = useState(false);

  const setStyle = useCallback((style: MapStyle) => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${style}`);
    setMapStyle(style);
  }, []);

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
      style: `mapbox://styles/mapbox/${mapStyle}`,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 45,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');
    
    map.current.on('style.load', () => {
      if(map.current) {
        if (!map.current.getSource('mapbox-dem')) {
            map.current.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 14
            });
        }
        map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
      }
      
      if (map.current && !map.current.getSource('measurement')) {
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
                'circle-color': '#fff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000'
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
        map.current?.addLayer({
            id: 'measurement-area',
            type: 'fill',
            source: 'measurement',
            paint: {
            'fill-color': '#0070f3',
            'fill-opacity': 0.1
            },
            filter: ['in', '$type', 'Polygon']
        });
        map.current?.addLayer({
            id: 'measurement-labels',
            type: 'symbol',
            source: 'measurement',
            layout: {
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 0.8],
            'text-anchor': 'top',
            'text-size': 12
            },
            paint: {
            'text-color': '#000',
            'text-halo-color': '#fff',
            'text-halo-width': 1
            },
            filter: ['has', 'label']
        });
      }
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast, mapStyle]);

  useEffect(() => {
    if (!map.current || mapStyle !== 'standard') return;
    if (showTraffic) {
      map.current.setConfigProperty('basemap', 'showTraffic', true);
    } else {
      map.current.setConfigProperty('basemap', 'showTraffic', false);
    }
  }, [showTraffic, map, mapStyle]);

  const handleMapClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    if (!isMeasuring || !map.current) return;
    
    const features = featureCollection([]);
    let currentPoints = [...measurementPoints];

    if (currentPoints.length > 0) {
        const firstPoint = turfPoint([currentPoints[0].lng, currentPoints[0].lat]);
        const clickPoint = turfPoint([e.lngLat.lng, e.lngLat.lat]);
        const dist = distance(firstPoint, clickPoint, { units: 'meters' });
        
        if (dist < 20 * (map.current.getZoom() / 10) && currentPoints.length > 1) { // Close polygon
            currentPoints.push(currentPoints[0]);
        } else {
            currentPoints.push(e.lngLat);
        }
    } else {
        currentPoints.push(e.lngLat);
    }
    
    setMeasurementPoints(currentPoints);
    
    const pointFeatures = currentPoints.map((p, i) => turfPoint([p.lng, p.lat], { id: i }));
    features.features.push(...pointFeatures);

    if (currentPoints.length > 1) {
      const lineCoords = currentPoints.map(p => [p.lng, p.lat]);
      const line = lineString(lineCoords);
      features.features.push(line);

      const calculatedDistance = length(line, { units: 'kilometers' });
      setTotalDistance(calculatedDistance);

      // Add segment labels
      for (let i = 0; i < lineCoords.length - 1; i++) {
        const segment = lineString([lineCoords[i], lineCoords[i+1]]);
        const segLength = length(segment, {units: 'kilometers'});
        const midpoint = turfPoint([(lineCoords[i][0] + lineCoords[i+1][0])/2, (lineCoords[i][1] + lineCoords[i+1][1])/2]);
        midpoint.properties = {
          label: `${segLength.toFixed(2)} km`
        };
        features.features.push(midpoint);
      }

      const first = currentPoints[0];
      const last = currentPoints[currentPoints.length - 1];
      if (currentPoints.length > 2 && first.lng === last.lng && first.lat === last.lat) {
        const poly = polygon([lineCoords]);
        features.features.push(poly);
        const calculatedArea = area(poly);
        setTotalArea(calculatedArea / 1000000); // convert to sq km
      } else {
        setTotalArea(0);
      }
    } else {
        setTotalDistance(0);
        setTotalArea(0);
    }
    
    const source = map.current.getSource('measurement') as mapboxgl.GeoJSONSource;
    if (source) {
        source.setData(features);
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
    setTotalDistance(0);
    setTotalArea(0);
    if (map.current) {
        const source = map.current.getSource('measurement') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(emptyGeoJSON);
        }
    }
  }, []);

  const toggleTraffic = () => {
    if (mapStyle !== 'standard') {
      toast({
        description: "Traffic is only available on the Standard map style.",
      });
      return;
    }
    setShowTraffic(prev => !prev);
  }

  const toggleMeasurement = () => {
    setIsMeasuring(prev => {
        if (prev) { // if turning off
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
         <Button
          size="icon"
          onClick={() => setShowStyleControl(prev => !prev)}
          variant={showStyleControl ? 'secondary' : 'outline'}
          className="bg-white/75 text-black backdrop-blur-sm transition-all hover:bg-white"
          aria-label="Toggle map styles"
        >
          <Layers className="h-5 w-5" />
        </Button>
      </div>

       {showStyleControl && (
        <MapStyleControl 
          currentStyle={mapStyle} 
          onStyleChange={setStyle} 
          className="absolute top-24 right-2.5 z-10"
        />
       )}

       {isMeasuring && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/75 backdrop-blur-sm p-3 rounded-lg shadow-md flex items-center gap-4">
            <div className="flex flex-col text-sm font-semibold">
              <p>
                  Total Distance: {totalDistance.toFixed(2)} km
              </p>
              {totalArea > 0 && (
                <p>
                  Total Area: {totalArea.toFixed(2)} km²
                </p>
              )}
               {measurementPoints.length > 1 && totalArea === 0 && (
                <p className="text-xs text-gray-500 font-normal">Click first point to close shape & calculate area.</p>
              )}
            </div>
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
