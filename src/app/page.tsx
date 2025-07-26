
'use client';
import React, 'useRef', useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { lineString, polygon, featureCollection, point as turfPoint, Feature, Point, FeatureCollection } from '@turf/helpers';
import length from '@turf/length';
import area from '@turf/area';
import distance from '@turf/distance';
import { MapStyleControl, type MapStyle } from '@/components/map-style-control';
import { DirectionsPanel } from '@/components/directions-panel';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { BottomNav } from '@/components/bottom-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ExplorePanel } from '@/components/explore-panel';
import { AnalyticsPanel } from '@/components/analytics-panel';
import { SavedPanel } from '@/components/saved-panel';
import { ChatPanel } from '@/components/chat-panel';
import { PlaceDetails } from '@/components/place-details';
import { listPlaces, ListPlacesOutput } from '@/ai/flows/list-places-flow';
import { Place } from '@/ai/schemas';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;

const emptyGeoJSON: FeatureCollection<any> = {
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
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark-v11');
  const [showStyleControl, setShowStyleControl] = useState(false);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);

  const [activePanel, setActivePanel] = useState<'explore' | 'analytics' | 'saved' | 'chat' | null>(null);
  const [places, setPlaces] = useState<ListPlacesOutput['places']>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  
  const setStyle = useCallback((style: MapStyle) => {
    if (!map.current) return;
    map.current.setStyle(`mapbox://styles/mapbox/${style}`);
    setMapStyle(style);
  }, []);

  const handlePanelChange = (panel: 'explore' | 'analytics' | 'saved' | 'chat' | null) => {
    if (activePanel === panel) {
      setActivePanel(null); // Close panel if clicking the same icon
    } else {
      setActivePanel(panel);
    }
  };

  const handleSavePlace = (placeToSave: Place) => {
    setSavedPlaces(prev => {
        const isAlreadySaved = prev.some(p => p.name === placeToSave.name);
        if (isAlreadySaved) {
            return prev.filter(p => p.name !== placeToSave.name);
        } else {
            return [...prev, placeToSave];
        }
    });
  };

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
      
      if (!map.current.getSource('measurement')) {
        map.current?.addSource('measurement', { type: 'geojson', data: emptyGeoJSON });
        map.current?.addLayer({ id: 'measurement-points', type: 'circle', source: 'measurement', paint: { 'circle-radius': 5, 'circle-color': '#fff', 'circle-stroke-width': 2, 'circle-stroke-color': '#000' }, filter: ['in', '$type', 'Point'] });
        map.current?.addLayer({ id: 'measurement-lines', type: 'line', source: 'measurement', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#000', 'line-width': 2.5 }, filter: ['in', '$type', 'LineString'] });
        map.current?.addLayer({ id: 'measurement-area', type: 'fill', source: 'measurement', paint: { 'fill-color': '#0070f3', 'fill-opacity': 0.1 }, filter: ['in', '$type', 'Polygon'] });
        map.current?.addLayer({ id: 'measurement-labels', type: 'symbol', source: 'measurement', layout: { 'text-field': ['get', 'label'], 'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'], 'text-offset': [0, 0.8], 'text-anchor': 'top', 'text-size': 12 }, paint: { 'text-color': '#000', 'text-halo-color': '#fff', 'text-halo-width': 1 }, filter: ['has', 'label'] });
      }
      if (!map.current.getSource('directions')) {
        map.current.addSource('directions', { type: 'geojson', data: emptyGeoJSON });
        map.current.addLayer({ id: 'directions-route', type: 'line', source: 'directions', paint: { 'line-width': 4, 'line-color': '#0070f3' } });
      }
       if (!map.current.getSource('places')) {
        map.current.addSource('places', { type: 'geojson', data: emptyGeoJSON });
        map.current.addLayer({
            id: 'places-markers',
            type: 'symbol',
            source: 'places',
            layout: {
                'icon-image': 'marker-15', // Default mapbox marker
                'icon-size': 1.5,
                'icon-allow-overlap': true,
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#fff',
                'text-halo-color': '#000',
                'text-halo-width': 1
            }
        });
      }
    });

    map.current.on('click', 'places-markers', (e) => {
        if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const place = places.find(p => p.name === feature.properties?.name);
            if (place) {
                setSelectedPlace(place);
            }
        }
    });

    map.current.on('mouseenter', 'places-markers', () => {
        if(map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    
    map.current.on('mouseleave', 'places-markers', () => {
        if(map.current) map.current.getCanvas().style.cursor = '';
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast, mapStyle, places]);
  
  useEffect(() => {
    if (!map.current) return;
    const placesSource = map.current.getSource('places') as mapboxgl.GeoJSONSource;
    if (placesSource) {
        const features = places.map(place => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [place.location.longitude, place.location.latitude]
            },
            properties: {
                name: place.name,
            }
        }));
        placesSource.setData(featureCollection(features));
    }

  }, [places, map]);


  useEffect(() => {
    if (!map.current || (mapStyle !== 'standard' && mapStyle !== 'streets-v12')) return;
    if (showTraffic) {
      map.current.setConfigProperty('basemap', 'showTraffic', true);
    } else {
      map.current.setConfigProperty('basemap', 'showTraffic', false);
    }
  }, [showTraffic, map, mapStyle]);

  const handleMapClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    if (!isMeasuring || !map.current) return;
    
    const features = featureCollection<any>([]);
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
    if (mapStyle !== 'standard' && mapStyle !== 'streets-v12') {
      toast({
        description: "Traffic is only available on the Standard or Streets map style.",
      });
      return;
    }
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

  const handleExplore = async (query: string) => {
    if (!map.current) return;
    const bounds = map.current.getBounds();
    const center = map.current.getCenter();
    try {
        const result = await listPlaces({
            query,
            center: { latitude: center.lat, longitude: center.lng },
            northEast: { latitude: bounds.getNorthEast().lat, longitude: bounds.getNorthEast().lng },
            southWest: { latitude: bounds.getSouthWest().lat, longitude: bounds.getSouthWest().lng }
        });
        setPlaces(result.places);
    } catch (error) {
        console.error("Error exploring places:", error);
        toast({
            variant: "destructive",
            title: "Failed to find places",
            description: "There was an error while searching for places. Please try again."
        });
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans dark">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <Header onToggleStyleControl={() => setShowStyleControl(prev => !prev)}/>
      <Sidebar 
        onToggleTraffic={toggleTraffic}
        onToggleMeasurement={toggleMeasurement}
        onToggleDirections={() => setShowDirectionsPanel(prev => !prev)}
        onToggleLayers={() => setShowStyleControl(prev => !prev)}
        showTraffic={showTraffic}
        isMeasuring={isMeasuring}
        showDirections={showDirectionsPanel}
        showLayers={showStyleControl}
      />
      <BottomNav onPanelChange={handlePanelChange} activePanel={activePanel} />
      
       <Sheet open={!!activePanel} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="left" className="w-[350px] sm:w-[400px] bg-card/80 backdrop-blur-sm border-r-border/50">
           {activePanel === 'explore' && <ExplorePanel onExplore={handleExplore} />}
           {activePanel === 'analytics' && <AnalyticsPanel places={places} />}
           {activePanel === 'saved' && <SavedPanel savedPlaces={savedPlaces} onSelectPlace={setSelectedPlace}/>}
           {activePanel === 'chat' && <ChatPanel />}
        </SheetContent>
      </Sheet>

      {selectedPlace && (
        <PlaceDetails 
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
            onSaveToggle={handleSavePlace}
            isSaved={savedPlaces.some(p => p.name === selectedPlace.name)}
        />
      )}

       {showStyleControl && (
        <MapStyleControl 
          currentStyle={mapStyle} 
          onStyleChange={setStyle} 
          className="absolute top-20 right-4 z-10"
        />
       )}
       
       <DirectionsPanel 
         map={map.current}
         isOpen={showDirectionsPanel}
         onClose={() => setShowDirectionsPanel(false)}
       />

       {isMeasuring && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 bg-card/80 backdrop-blur-sm p-3 rounded-lg shadow-md flex items-center gap-4 text-card-foreground">
            <div className="flex flex-col text-sm font-semibold">
              <p>Total Distance: {totalDistance.toFixed(2)} km</p>
              {totalArea > 0 && <p>Total Area: {totalArea.toFixed(2)} km²</p>}
              {measurementPoints.length > 1 && totalArea === 0 && (
                <p className="text-xs text-muted-foreground font-normal">Click first point to close shape & calculate area.</p>
              )}
            </div>
            <Button size="sm" variant="destructive" onClick={clearMeasurement}>Clear</Button>
        </div>
      )}
    </div>
  );
}
