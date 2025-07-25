'use server';
/**
 * @fileOverview A flow for finding a location on the map from a search query.
 *
 * - search - A function that handles the location search process.
 */

import {ai} from '@/ai/genkit';
import { SearchInputSchema, SearchOutputSchema, SearchInput, SearchOutput } from '@/ai/schemas';

export async function search(
  input: SearchInput
): Promise<SearchOutput> {
  return searchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchPrompt',
  input: {schema: SearchInputSchema},
  output: {schema: SearchOutputSchema},
  prompt: `You are a helpful assistant that can find places on a map and provide a brief description of them.
The user will provide a search query and you will return the latitude, longitude, a recommended zoom level for the map, and a short, interesting description of the place.

Search Query: {{{query}}}`,
});

const searchFlow = ai.defineFlow(
  {
    name: 'searchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
