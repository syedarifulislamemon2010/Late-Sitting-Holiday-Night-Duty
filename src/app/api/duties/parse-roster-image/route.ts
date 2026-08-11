import logger from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUser } from "@/lib/auth-wrapper";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "api_key_missing", 
        message: "Gemini API key is not configured on the server." 
      }, { status: 400 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const dutyType = formData.get("dutyType") as string; // LATE_SITTING | HOLIDAY | NIGHT_SHIFT
    const cellId = parseInt(formData.get("cellId") as string);

    if (!imageFile || !dutyType || isNaN(cellId)) {
      return NextResponse.json({ 
        error: "validation_error", 
        message: "image, dutyType এবং cellId আবশ্যক।" 
      }, { status: 400 });
    }

    // Convert image to base64
    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString("base64");
    const mimeType = imageFile.type;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const extractionPrompt = `
      এটি একটি বাংলাদেশের ব্যাংকের ডিউটি রোস্টারের ছবি। এই ছবি থেকে নিম্নলিখিত তথ্য বের করে JSON ফরম্যাটে দাও।

      নিয়মকানুন:
      1. প্রতিটি কর্মকর্তার নাম, ব্যাংক আইডি (employee ID / bank ID), এবং তারিখ বের করো
      2. তারিখ ISO 8601 ফরম্যাটে দাও (YYYY-MM-DD)
      3. শুধুমাত্র JSON array রিটার্ন করো, অন্য কিছু নয়
      4. বাংলা সংখ্যাকে ইংরেজি সংখ্যায় রূপান্তরিত করো

      প্রত্যাশিত JSON ফরম্যাট:
      [
        {
          "bankId": "028144",
          "employeeName": "জনাব মোঃ রিয়াজুল হাসান",
          "dates": ["2026-06-10", "2026-06-11"]
        }
      ]

      যদি কোনো তথ্য অস্পষ্ট হয়, সেটি বাদ দাও। শুধু নিশ্চিত তথ্য অন্তর্ভুক্ত করো।
    `;

    const result = await model.generateContent([
      extractionPrompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);

    const responseText = result.response.text().trim();
    
    // Clean up markdown code blocks if Gemini wraps in ```json
    const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsedRoster = JSON.parse(cleanJson);

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    await logActivity({
      username: session.username,
      action: 'CREATE',
      entityType: 'DUTY',
      ipAddress,
      userAgent,
      details: `${session.name} (@${session.username}) AI OCR এর মাধ্যমে রোস্টার ইমেজ থেকে ${parsedRoster.length}টি ডিউটি এন্ট্রি এক্সট্রাক্ট করেছেন।`
    });

    // Return extracted data for operator review before final import
    return NextResponse.json({
      success: true,
      extractedEntries: parsedRoster,
      totalEntries: parsedRoster.length,
      message: `${parsedRoster.length}টি রোস্টার এন্ট্রি সফলভাবে স্ক্যান করা হয়েছে। নিচে যাচাই করে "নিশ্চিত করুন" বাটন চাপুন।`,
      requiresConfirmation: true,
    });

  } catch (error) {
    logger.error("Roster OCR error:", error);
    return NextResponse.json(
      { error: "internal_server_error", message: "রোস্টার স্ক্যান করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
