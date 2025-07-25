
'use client';
import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Map as MapIcon, Send, Clock, Star, Tag, ChevronDown, Phone, Globe, Calendar, MoreHorizontal, PersonStanding, Car } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { search, SearchOutput } from '@/ai/flows/search-flow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlaceCard } from '@/components/place-card';
import { places, Place } from '@/lib/data';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [-73.9876, 40.7484];
const initialZoom = 13;
const initialStyle = 'mapbox://styles/mapbox/standard';


export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const placeMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapStyle, setMapStyle] = useState(initialStyle);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);

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
      style: mapStyle,
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

    map.current.on('load', () => {
        places.forEach(place => {
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage = `url('https://placehold.co/40x40/f97316/ffffff.png?text=${place.icon ? "R" : "P" }')`;
            el.style.width = `40px`;
            el.style.height = `40px`;
            el.style.backgroundSize = '100%';

            const marker = new mapboxgl.Marker(el)
                .setLngLat(place.coordinates as [number, number])
                .addTo(map.current!);
            
            marker.getElement().addEventListener('click', () => {
                setSelectedPlace(place);
                setSheetOpen(true);
                map.current?.flyTo({ center: place.coordinates as [number, number], zoom: 15 });
            });
            placeMarkers.current.push(marker);
        });
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, []);

  useEffect(() => {
    if (map.current) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query || !map.current) return;
    setLoading(true);

    try {
      const result = await search({ query });

      if (placeMarkers.current) {
        placeMarkers.current.forEach(m => m.remove());
        placeMarkers.current = [];
      }
      
      setSelectedPlace({
        id: 'search-result',
        name: query,
        description: result.description,
        coordinates: [result.long, result.lat],
        rating: 0,
        reviews: 0,
        type: 'search-result',
        images: [],
        hours: '',
        tags: [],
        phone: '',
        website: '',
        photosBy: '',
        posts: [],
      })
      
      map.current.flyTo({
        center: [result.long, result.lat],
        zoom: result.zoom,
        pitch: 45,
        essential: true,
      });
      
      new mapboxgl.Marker()
        .setLngLat([result.long, result.lat])
        .addTo(map.current);
      setSheetOpen(true);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Could not find the requested location. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setSelectedPlace(null);
    }
    setSheetOpen(open);
  }

  const mapStyles = [
    { name: 'Standard', value: 'mapbox://styles/mapbox/standard' },
    { name: 'Streets', value: 'mapbox://styles/mapbox/streets-v12' },
    { name: 'Outdoors', value: 'mapbox://styles/mapbox/outdoors-v12' },
    { name: 'Light', value: 'mapbox://styles/mapbox/light-v11' },
    { name: 'Dark', value: 'mapbox://styles/mapbox/dark-v11' },
    { name: 'Satellite', value: 'mapbox://styles/mapbox/satellite-v9' },
    { name: 'Satellite Streets', value: 'mapbox://styles/mapbox/satellite-streets-v12' },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      
       <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
                <MapIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Map Styles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mapStyles.map((style) => (
              <DropdownMenuItem key={style.value} onSelect={() => setMapStyle(style.value)}>
                {style.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl flex flex-col p-0" overlayClassName="bg-transparent">
             <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Locations</SheetTitle>
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search for a place or address" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
                    {query && <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setQuery('')}><X className="h-4 w-4" /></Button>}
                  </div>
                </form>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-full"><MapIcon className="h-4 w-4 mr-2" /> All</Button>
                    <Button variant="outline" size="sm" className="rounded-full">Restaurants</Button>
                    <Button variant="outline" size="sm" className="rounded-full">Hotels</Button>
                    <Button variant="outline" size="sm" className="rounded-full">Gas</Button>
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {selectedPlace ? (
                    <div className="space-y-6">
                      <div className="relative h-48 w-full rounded-lg overflow-hidden">
                        <img src={selectedPlace.images[0] || 'https://placehold.co/600x400.png'} alt={selectedPlace.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold">{selectedPlace.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                           <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span>{selectedPlace.rating}</span>
                          </div>
                          <span>({selectedPlace.reviews} reviews)</span>
                          <span>&middot;</span>
                          <span>{selectedPlace.type}</span>
                        </div>
                         <div className="flex flex-wrap gap-2 pt-2">
                          {selectedPlace.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {selectedPlace.hours}</div>
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selectedPlace.phone}</div>
                        <div className="flex items-center gap-2 col-span-2"><Globe className="h-4 w-4" /> {selectedPlace.website}</div>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold">From the business</h3>
                        <p className="text-sm text-muted-foreground mt-2">{selectedPlace.description}</p>
                      </div>
                      <Separator />
                       <div>
                        <h3 className="font-semibold mb-2">Photos</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedPlace.images.map((img, i) => (
                            <img key={i} src={img} alt={`${selectedPlace.name} photo ${i}`} className="rounded-lg object-cover aspect-square" />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Photos by {selectedPlace.photosBy}</p>
                      </div>
                       <Separator />
                       <div>
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">Latest Posts</h3>
                          <Button variant="ghost" size="sm">See all</Button>
                        </div>
                        <div className="space-y-4 mt-2">
                          {selectedPlace.posts?.map((post, i) => (
                            <div key={i} className="flex gap-4">
                               <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                                {post.image && <img src={post.image} className="w-full h-full object-cover rounded-lg" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {post.date}
                                </div>
                                <p className="text-sm font-medium mt-1 line-clamp-2">{post.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Popular near you</h2>
                        <Button variant="ghost" size="sm">See all</Button>
                      </div>
                      {places.map((place) => (
                        <PlaceCard key={place.id} place={place} onClick={() => { setSelectedPlace(place); map.current?.flyTo({ center: place.coordinates as [number, number], zoom: 15 }); }} />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
              {selectedPlace && (
                <div className="p-4 border-t">
                  <Button className="w-full" onClick={() => setSelectedPlace(null)}>
                    Back to list
                  </Button>
                </div>
              )}
          </SheetContent>
      </Sheet>
    </div>
  );
}
