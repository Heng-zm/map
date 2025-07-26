
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface ExplorePanelProps {
  onExplore: (query: string) => Promise<void>;
}

export function ExplorePanel({ onExplore }: ExplorePanelProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    await onExplore(query);
    setIsLoading(false);
  };
  
  const exampleSearches = [
    "Modern coffee shops",
    "Parks with playgrounds",
    "Bookstores with cafes",
    "Art galleries"
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Explore</h2>
      <div className="flex items-center gap-2 mb-4">
        <Input
          placeholder="e.g., 'parks with playgrounds'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          disabled={isLoading}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      
      <Card className="mt-4 bg-transparent border-border/50">
        <CardHeader>
            <CardTitle className="text-lg">Examples</CardTitle>
            <CardDescription>Click one to search</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-2">
                {exampleSearches.map(example => (
                    <Button 
                        key={example}
                        variant="outline"
                        className="justify-start"
                        onClick={() => {
                            setQuery(example);
                            onExplore(example);
                        }}
                    >
                        {example}
                    </Button>
                ))}
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
