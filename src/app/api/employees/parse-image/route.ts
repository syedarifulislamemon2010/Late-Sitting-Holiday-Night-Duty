import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { fileData, fileType, customApiKey } = await request.json();
    
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'api_key_missing', 
        message: 'ক্লিপবোর্ড থেকে ছবি পেস্ট করে ইম্পোর্ট করার জন্য একটি Gemini API Key প্রয়োজন। অনুগ্রহ করে .env ফাইলে GEMINI_API_KEY সেট করুন অথবা এখানে একটি কি (Key) প্রদান করুন।' 
      }, { status: 400 });
    }

    if (!fileData) {
      return NextResponse.json({ error: 'file_required', message: 'অনুগ্রহ করে ইমেজ ফাইল ডেটা প্রদান করুন।' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash which is robust and available everywhere
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
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
    const result = await model.generateContent([
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
  } catch (error: any) {
    console.error('Error parsing employee image:', error);
    return NextResponse.json({ error: 'failed_to_parse_image', message: error.message }, { status: 550 });
  }
}
