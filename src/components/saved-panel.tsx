
'use client';

import { Place } from '@/ai/schemas';
import { Button } from './ui/button';
import Image from 'next/image';

interface SavedPanelProps {
  savedPlaces: Place[];
  onSelectPlace: (place: Place) => void;
}

export function SavedPanel({ savedPlaces, onSelectPlace }: SavedPanelProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Saved Places</h2>
      {savedPlaces.length > 0 ? (
        <div className="space-y-2 overflow-y-auto">
          {savedPlaces.map((place) => (
            <Button
              key={place.name}
              variant="ghost"
              className="w-full h-auto justify-start p-2 text-left"
              onClick={() => onSelectPlace(place)}
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                    <Image
                        src={place.photos[0]}
                        alt={place.name}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                    />
                </div>
                <div>
                  <p className="font-semibold">{place.name}</p>
                  <p className="text-sm text-muted-foreground">{place.category}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center mt-8">
          You haven't saved any places yet.
        </p>
      )}
    </div>
  );
}
