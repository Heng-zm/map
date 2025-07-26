/**
 * @fileOverview Schemas for AI flows.
 */

import { z } from 'genkit';

export const LocationAnalysisInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type LocationAnalysisInput = z.infer<typeof LocationAnalysisInputSchema>;

export const LocationAnalysisOutputSchema = z.object({
  analysis: z.string().describe('The AI-generated analysis of the location.'),
  locationName: z.string().describe('The name of the location (e.g., city, region).'),
});
export type LocationAnalysisOutput = z.infer<typeof LocationAnalysisOutputSchema>;


export const TranslateInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  language: z.string().describe('The target language for translation.'),
});
export type TranslateInput = z.infer<typeof TranslateInputSchema>;

export const TranslateOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateOutput = z.infer<typeof TranslateOutputSchema>;
