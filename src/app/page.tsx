
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { getWeather } from '@/ai/flows/weather-flow';
import { translateText } from '@/ai/flows/translate-flow';
import { Thermometer, Wind, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [translatedCondition, setTranslatedCondition] = useState<string | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);


  const fetchWeatherForLocation = async (lat: number, lng: number) => {
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
    setTranslatedCondition(null);
    
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF0000"/><path d="M12 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0" stroke="white" stroke-width="1.5"/></svg>`;
      if (map.current) {
        marker.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    }

    try {
      const weatherData = await getWeather({ latitude: lat, longitude: lng });
      setWeather(weatherData);

      const translation = await translateText({ text: weatherData.condition, language: 'Khmer' });
      setTranslatedCondition(translation.translatedText);
      
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
  }

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
      style: 'mapbox://styles/mapbox/outdoors-v12',
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

      // Request user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.setCenter([longitude, latitude]);
            fetchWeatherForLocation(latitude, longitude);
          },
          () => {
            toast({
              title: "Location Access Denied",
              description: "Showing default location. Click on the map to see weather elsewhere.",
            });
            // Fetch for default location if user denies
            fetchWeatherForLocation(initialCenter[1], initialCenter[0]);
          }
        );
      } else {
        // Fetch for default location if geolocation is not available
        fetchWeatherForLocation(initialCenter[1], initialCenter[0]);
      }
    });

    map.current.on('click', async (e) => {
      const { lat, lng } = e.lngLat;
      fetchWeatherForLocation(lat, lng);
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);
  

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-body dark">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <div className={cn(
          "absolute top-0 w-full bg-black/70 p-4 text-white backdrop-blur-md transition-all duration-500 ease-in-out rounded-b-lg",
          (loadingWeather || weather) ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}>
          <h1 className="text-xl font-bold">អាកាសធាតុ</h1>
          {loadingWeather && <p className="mt-2">កំពុងផ្ទុកទិន្នន័យអាកាសធាតុ...</p>}
          {weather && (
          <div className="mt-2">
              <p className="text-lg font-semibold">{weather.location}</p>
              <div className="flex items-center gap-2 mt-2">
              <Thermometer className="h-5 w-5" />
              <span>{weather.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                  <Cloud className="h-5 w-5" />
                  <span>{translatedCondition || weather.condition}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                  <Wind className="h-5 w-5" />
                  <span>{weather.windSpeed.toFixed(1)} m/s</span>
              </div>
          </div>
          )}
          {!loadingWeather && !weather && (
            <p className="mt-2">ចុចលើផែនទីដើម្បីមើលអាកាសធាតុ</p>
          )}
      </div>
    </div>
  );
}
