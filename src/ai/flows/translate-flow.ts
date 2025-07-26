'use server';
/**
 * @fileOverview A flow for translating text.
 *
 * - translateText - A function that translates text to a specified language.
 * - TranslateInput - The input type for the translateText function.
 * - TranslateOutput - The return type for the translateText function.
 */

import { ai } from '@/ai/genkit';
import { TranslateInput, TranslateInputSchema, TranslateOutput, TranslateOutputSchema } from '@/ai/schemas';

export async function translateText(input: TranslateInput): Promise<TranslateOutput> {
    return translateFlow(input);
}

const prompt = ai.definePrompt({
    name: 'translatePrompt',
    input: { schema: TranslateInputSchema },
    output: { schema: TranslateOutputSchema },
    prompt: `Translate the following text to {{language}}: {{{text}}}`,
});

const translateFlow = ai.defineFlow(
    {
        name: 'translateFlow',
        inputSchema: TranslateInputSchema,
        outputSchema: TranslateOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
