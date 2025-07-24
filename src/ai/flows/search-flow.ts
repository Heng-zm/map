'use server';
/**
 * @fileOverview A flow for finding a location on the map from a search query.
 *
 * - search - A function that handles the location search process.
 * - SearchInput - The input type for the search function.
 * - SearchOutput - The return type for the search function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query from the user.'),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

const SearchOutputSchema = z.object({
  lat: z.number().describe('The latitude of the found location.'),
  long: z.number().describe('The longitude of the found location.'),
  zoom: z.number().describe('A recommended zoom level for the map.'),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

export async function search(
  input: SearchInput
): Promise<SearchOutput> {
  return searchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchPrompt',
  input: {schema: SearchInputSchema},
  output: {schema: SearchOutputSchema},
  prompt: `You are a helpful assistant that can find places on a map.
The user will provide a search query and you will return the latitude, longitude, and a recommended zoom level for the map.

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
