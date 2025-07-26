'use server';
/**
 * @fileOverview A Genkit flow for handling chat conversations with an AI assistant.
 *
 * - chat - A function that takes conversation history and returns the model's response.
 * - ChatInput - The Zod schema for the input of the `chat` flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  ChatInputSchema,
  ChatMessageSchema,
  type ChatInput
} from '@/ai/schemas';

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { history } = input;
    const { text } = await ai.generate({
      prompt: `
        You are a friendly and helpful AI assistant for a map application.
        Your role is to answer user questions about the map, its features,
        or any general queries they might have. Keep your responses concise
        and informative.
      `,
      history: history.map(msg => ({ role: msg.role, content: [{ text: msg.content }] })),
    });
    return text;
  }
);

/**
 * Handles a chat conversation with the AI assistant.
 * @param input The conversation history.
 * @returns A promise that resolves to the model's response as a string.
 */
export async function chat(input: ChatInput): Promise<string> {
  return chatFlow(input);
}
