
'use server';
/**
 * @fileOverview A flow for getting directions between two points.
 *
 * - getDirections - A function that handles the directions process.
 */

import {ai} from '@/ai/genkit';
import { GetDirectionsInputSchema, GetDirectionsOutputSchema, GetDirectionsInput, GetDirectionsOutput } from '@/ai/schemas';


export async function getDirections(
  input: GetDirectionsInput
): Promise<GetDirectionsOutput> {
  return getDirectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getDirectionsPrompt',
  input: {schema: GetDirectionsInputSchema},
  output: {schema: GetDirectionsOutputSchema},
  prompt: `You are a helpful mapping assistant. The user will provide an origin and a destination, and you will return a plausible route between them as a series of coordinates.
The route should be a realistic path, not a straight line. Generate between 10 and 20 points for the route.

Origin: {{{origin}}}
Destination: {{{destination}}}`,
});

const getDirectionsFlow = ai.defineFlow(
  {
    name: 'getDirectionsFlow',
    inputSchema: GetDirectionsInputSchema,
    outputSchema: GetDirectionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
