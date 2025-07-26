
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { getWeather } from '@/ai/flows/weather-flow';
import { Thermometer, Wind, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  location: string;
}

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

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
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: initialCenter,
      zoom: initialZoom,
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
    });

    map.current.on('click', async (e) => {
      if (!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY) {
        toast({
          variant: "destructive",
          title: "OpenWeather API Key Missing",
          description: "Please add your OpenWeatherMap API key to the .env file.",
        });
        return;
      }

      setLoadingWeather(true);
      setWeather(null);
      try {
        const { lat, lng } = e.lngLat;
        const weatherData = await getWeather({ latitude: lat, longitude: lng });
        setWeather(weatherData);
      } catch (error) {
        console.error("Failed to fetch weather data", error);
        toast({
          variant: "destructive",
          title: "Could not fetch weather",
          description: "An error occurred while fetching weather data.",
        });
      } finally {
        setLoadingWeather(false);
      }
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);
  

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans dark">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <div className={cn(
          "absolute top-0 w-full bg-black/70 p-4 text-white backdrop-blur-md transition-all duration-500 ease-in-out",
          (loadingWeather || weather) ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}>
          <h1 className="text-xl font-bold">Weather</h1>
          {loadingWeather && <p className="mt-2">Loading weather...</p>}
          {weather && (
          <div className="mt-2">
              <p className="text-lg font-semibold">{weather.location}</p>
              <div className="flex items-center gap-2 mt-2">
              <Thermometer className="h-5 w-5" />
              <span>{weather.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                  <Cloud className="h-5 w-5" />
                  <span>{weather.condition}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                  <Wind className="h-5 w-5" />
                  <span>{weather.windSpeed.toFixed(1)} m/s</span>
              </div>
          </div>
          )}
          {!loadingWeather && !weather && (
            <p className="mt-2">Click on the map to see the weather</p>
          )}
      </div>
    </div>
  );
}
