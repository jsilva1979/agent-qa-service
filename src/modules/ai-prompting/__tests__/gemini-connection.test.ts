import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

describe('Gemini API Connection (TEMPORARY)', () => {
  it('should connect and generate a simple response', async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    expect(apiKey).toBeTruthy();

    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = 'Say hello world!';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
    console.log('Gemini API response:', text);
  }, 15000);
}); 