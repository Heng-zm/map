
'use server';
/**
 * @fileOverview A flow for finding a list of places from a search query.
 *
 * - listPlaces - A function that handles the location list search process.
 */

import {ai} from '@/ai/genkit';
import { ListPlacesInputSchema, ListPlacesOutputSchema, ListPlacesInput, ListPlacesOutput } from '@/ai/schemas';

export async function listPlaces(
  input: ListPlacesInput
): Promise<ListPlacesOutput> {
  return listPlacesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'listPlacesPrompt',
  input: {schema: ListPlacesInputSchema},
  output: {schema: ListPlacesOutputSchema},
  prompt: `You are a helpful assistant that can find places on a map and provide a brief description of them.
The user will provide a search query and you will return a list of places that match.
For each place, provide all the information in the schema. Generate realistic but not necessarily real data for fields like phone, website, etc.
If the search query contains coordinates, prioritize results near that location.
For images, use placeholder URLs from https://placehold.co.
Generate 3-5 realistic posts for each business, with dates from the last month.
The coordinates must be in [longitude, latitude] format.

{{#if type}}
Only return places of type: {{{type}}}.
{{/if}}

Search Query: {{{query}}}`,
});

const listPlacesFlow = ai.defineFlow(
  {
    name: 'listPlacesFlow',
    inputSchema: ListPlacesInputSchema,
    outputSchema: ListPlacesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
