'use server';
/**
 * @fileOverview A flow for analyzing a location.
 *
 * - analyzeLocation - A function that provides an AI-generated analysis of a location.
 * - LocationAnalysisInput - The input type for the analyzeLocation function.
 * - LocationAnalysisOutput - The return type for the analyzeLocation function.
 */

import { ai } from '@/ai/genkit';
import { LocationAnalysisInput, LocationAnalysisInputSchema, LocationAnalysisOutput, LocationAnalysisOutputSchema } from '@/ai/schemas';

export async function analyzeLocation(input: LocationAnalysisInput): Promise<LocationAnalysisOutput> {
    return locationAnalysisFlow(input);
}

const prompt = ai.definePrompt({
    name: 'locationAnalysisPrompt',
    input: { schema: LocationAnalysisInputSchema },
    output: { schema: LocationAnalysisOutputSchema },
    prompt: `You are a master geographer and historian. Analyze the location at latitude: {{latitude}} and longitude: {{longitude}}.

Provide a detailed and insightful analysis of the location in Khmer. Your analysis must include:
1.  **Clear Geographical Analysis**: Describe the terrain, climate, and significant natural features like rivers, mountains, or coastlines. Be specific and clear in your geographical descriptions.
2.  **Rich Historical Context**: Explain the history of the area, including key events, historical figures, and its cultural significance.
3.  **Notable Points of Interest**: Mention any important landmarks, tourist attractions, or hidden gems.

Finally, provide the official name of the location in Khmer.`,
});

const locationAnalysisFlow = ai.defineFlow(
    {
        name: 'locationAnalysisFlow',
        inputSchema: LocationAnalysisInputSchema,
        outputSchema: LocationAnalysisOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
