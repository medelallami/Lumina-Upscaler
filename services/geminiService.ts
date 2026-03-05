import { GoogleGenAI } from "@google/genai";
import { UpscaleOptions } from "../types";

// Helper to determine the closest supported aspect ratio
const getClosestAspectRatio = (width: number, height: number): string => {
  const targetRatio = width / height;
  const supportedRatios: Record<string, number> = {
    '1:1': 1,
    '3:4': 0.75,
    '4:3': 1.333333,
    '9:16': 0.5625,
    '16:9': 1.777778
  };

  return Object.keys(supportedRatios).reduce((prev, curr) => {
    return (Math.abs(supportedRatios[curr] - targetRatio) < Math.abs(supportedRatios[prev] - targetRatio) ? curr : prev);
  });
};

export const upscaleImage = async (
  base64Data: string,
  mimeType: string,
  width: number,
  height: number,
  options: UpscaleOptions
): Promise<string> => {
  // Use the standard environment variable for the API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Calculate best aspect ratio
  const aspectRatio = getClosestAspectRatio(width, height);

  // Customize prompt based on mode
  let taskDescription = options.mode === '2x'
    ? "Upscale this image 2x. Increase pixel density, resolution and details. Focus on sharp edges and realistic textures."
    : "Enhance this image. Improve resolution, clarity, and detail significantly.";

  if (options.removeBackground) {
    taskDescription += " Also, remove the background and replace it with a solid white background.";
  }

  // Add detail level instructions
  switch (options.detailLevel) {
    case 'low':
      taskDescription += " Maintain original textures and look. Do not add excessive details.";
      break;
    case 'medium':
      taskDescription += " Enhance details naturally while preserving the original style.";
      break;
    case 'high':
      taskDescription += " Add intricate details, sharpen textures, and enhance micro-contrast for a high-definition look.";
      break;
  }

  // Simplified prompt to ensure model understands it is an image generation task
  const prompt = `${taskDescription}
    Requirements:
    - High fidelity to original.
    - Remove artifacts/noise.
    - Do not change content unless removing background.
    - Output pure image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          // IMPORTANT: Image part must come before text for editing tasks to work reliably
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        temperature: options.creativity, // Use creativity as temperature
        imageConfig: {
          aspectRatio: aspectRatio, 
        }
      },
    });

    let textResponse = '';

    // Extract image
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
        if (part.text) {
          textResponse += part.text;
        }
      }
    }

    // If text was returned but no image, treat it as a refusal/error
    if (textResponse) {
      console.warn("Model returned text instead of image:", textResponse);
      throw new Error(`AI Request Failed: ${textResponse.slice(0, 150)}...`);
    }

    throw new Error("No image data returned from the model.");

  } catch (error: any) {
    console.error("Upscaling failed:", error);
    throw error;
  }
};
