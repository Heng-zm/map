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
    prompt: `Analyze the location at latitude: {{latitude}} and longitude: {{longitude}}. Provide a concise and interesting analysis of the location. Include details about its geography, history, and any notable points of interest. Also, provide the name of the location.`,
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
