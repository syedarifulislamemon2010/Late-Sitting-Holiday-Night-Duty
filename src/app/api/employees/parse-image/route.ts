import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult, Part } from '@google/generative-ai';
import { imageParseSchema } from '@/validations/imageParse.schema';

// Helper function to handle API calls with exponential backoff retries
async function generateContentWithRetry(
  model: GenerativeModel, 
  content: string | Array<string | Part>, 
  retries = 2, 
  delayMs = 1000
): Promise<GenerateContentResult> {
  try {
    return await model.generateContent(content);
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Gemini API call failed. Retrying in ${delayMs}ms... (Remaining retries: ${retries})`, error);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return generateContentWithRetry(model, content, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const validation = imageParseSchema.safeParse({
      image: rawBody.fileData || rawBody.image,
      mimeType: rawBody.fileType || rawBody.mimeType
    });

    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অনুগ্রহ করে ইমেজ ফাইল ডেটা প্রদান করুন।',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { image: fileData, mimeType: fileType } = validation.data;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'api_key_missing', 
        message: 'ছবি থেকে কর্মকর্তা ইম্পোর্ট করার জন্য সার্ভারে GEMINI_API_KEY সেট থাকা আবশ্যক। অনুগ্রহ করে আপনার সার্ভার এনভায়রনমেন্ট চেক করুন।' 
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are a professional administrative assistant. Analyze the provided image which contains a list, table, or handwritten/printed document showing names and designations of officers (employees).
Extract the names and designations of all officers listed in the image.
Translate, clean, and map any designations to their Bengali representation (e.g. Senior Officer-IT to সিনিয়র অফিসার-আইটি (এসও-আইটি) or Deputy General Manager to উপ-মহাব্যবস্থাপক).

Return a JSON array of officer objects. Each object MUST have precisely these keys:
- "name": string containing the full name of the officer in Bengali (e.g., "জনাব মোঃ আশরাফুল ইসলাম")
- "designation": string containing their designation in Bengali (e.g., "সিনিয়র অফিসার-আইটি (এসও-আইটি)" or "উপ-মহাব্যবস্থাপক")

Provide only the JSON array as output, no markdown wrappers, no formatting, just raw JSON.`;

    const base64Data = fileData.split(',')[1] || fileData;
    
    // Call Gemini API with automatic retry fallback
    const result = await generateContentWithRetry(model, [
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: fileType || 'image/png'
        }
      }
    ]);

    const responseText = result.response.text().trim();
    let parsedEmployees = JSON.parse(responseText);

    if (Array.isArray(parsedEmployees)) {
      parsedEmployees = parsedEmployees.map(item => ({
        name: item.name || 'অজ্ঞাত কর্মকর্তা',
        designation: item.designation || 'অফিসার-আইটি (ও-আইটি)'
      }));
    } else {
      throw new Error('AI returned non-array structure');
    }

    return NextResponse.json({ success: true, employees: parsedEmployees });
  } catch (error) {
    logger.error('Error parsing employee image:', error);
    return NextResponse.json({ 
      error: 'failed_to_parse_image', 
      message: `ইমেজ প্রসেস করতে ব্যর্থ হয়েছে। ছবিটির রেজোলিউশন ঠিক আছে কিনা এবং লেখাগুলো পরিষ্কার কিনা নিশ্চিত করুন। প্রয়োজনে ম্যানুয়ালি ইনপুট দিন। বিস্তারিত ত্রুটি: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}
