import { GoogleGenAI, Type } from '@google/genai';

export async function generateEmotionImages(base64Image: string, skipImageGeneration?: boolean): Promise<Record<string, string>> {
  const emotions = ['neutral', 'happy', 'angry', 'impatient', 'sad', 'surprised'];
  const results: Record<string, string> = {};

  if (skipImageGeneration) {
    for (const emotion of emotions) {
      results[emotion] = base64Image;
    }
    return results;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1];

  // We'll generate them in a single prompt as a grid to save tokens/time, 
  // but the user asked for "one image per emotion". 
  // To be safe and high quality, let's try to generate them as a 3x2 grid and then we'd need to crop.
  // Actually, generating them one by one is safer for identity but slower.
  // Let's try a 3x2 grid and explain how to use it, or just generate them sequentially if we want to be simple.
  // Given the "one image per emotion" request, I'll generate them in a way that I can extract them.
  // Actually, I'll just generate them one by one for maximum quality and identity consistency.
  
  for (const emotion of emotions) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: `Generate a portrait of the EXACT same person from the image, but with a ${emotion} expression. Maintain identity, clothing, and background.`,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          results[emotion] = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (error) {
      console.error(`Error generating image for ${emotion}:`, error);
      results[emotion] = base64Image; // Fallback
    }
  }

  return results;
}

export async function detectGenderAndVoice(base64Image: string): Promise<{ gender: string, voice: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: 'Analyze the person in this image. Is it a man or a woman? Respond only with "male" or "female".',
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gender: { type: Type.STRING, enum: ['male', 'female'] }
          },
          required: ['gender']
        }
      }
    });

    const result = JSON.parse(response.text || '{"gender": "female"}');
    const gender = result.gender;

    const maleVoices = ['Puck', 'Charon', 'Fenrir'];
    const femaleVoices = ['Kore', 'Zephyr'];
    
    const voices = gender === 'male' ? maleVoices : femaleVoices;
    const voice = voices[Math.floor(Math.random() * voices.length)];

    return { gender, voice };
  } catch (error) {
    console.error('Error detecting gender:', error);
    return { gender: 'female', voice: 'Zephyr' };
  }
}

export async function generateSpriteSheet(base64Image: string): Promise<string> {
  // Keeping this for backward compatibility if needed, but we'll use the new ones
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: 'A 2x2 grid showing the exact same person with 4 different facial expressions: top-left neutral, top-right happy, bottom-left angry, bottom-right impatient. Maintain the exact identity, clothing, and background if possible. High quality portrait.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error('No image generated');
  } catch (error) {
    console.error('Error generating sprite sheet:', error);
    return base64Image;
  }
}
