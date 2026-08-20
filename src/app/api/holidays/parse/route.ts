import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { holidayParseSchema } from '@/validations/holiday.schema';

const MONTHS_MAP: { [key: string]: number } = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
};

interface ParsedHoliday {
  date: string;
  name: string;
  isWorkingDay: boolean;
}

// High-performance regex parser for copy-pasted holiday strings
function fallbackParseHolidays(text: string, defaultYear: number = 2026): ParsedHoliday[] {
  const lines = text.split('\n');
  const results: ParsedHoliday[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    let name = 'সরকারি ছুটি';
    let datePart = line;
    
    if (line.includes(':')) {
      const idx = line.indexOf(':');
      name = line.substring(0, idx).trim();
      datePart = line.substring(idx + 1).trim();
    }

    let year = defaultYear;
    const yearMatch = line.match(/\b(202\d|203\d)\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
    }

    const parsedDates: string[] = [];

    const rangeMatch = datePart.match(/(\d+)\s+([A-Za-z]+)\s+to\s+(\d+)\s+([A-Za-z]+)/i);
    const rangeMatchSimple = datePart.match(/(\d+)\s+to\s+(\d+)\s+([A-Za-z]+)/i);

    if (rangeMatch) {
      const startDay = parseInt(rangeMatch[1], 10);
      const startMonthStr = rangeMatch[2].toLowerCase();
      const endDay = parseInt(rangeMatch[3], 10);
      const endMonthStr = rangeMatch[4].toLowerCase();

      const startMonth = MONTHS_MAP[startMonthStr] ?? 0;
      const endMonth = MONTHS_MAP[endMonthStr] ?? 0;

      const startDateObj = new Date(year, startMonth, startDay);
      const endDateObj = new Date(year, endMonth, endDay);

      const curr = new Date(startDateObj);
      while (curr <= endDateObj) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        parsedDates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }
    } else if (rangeMatchSimple) {
      const startDay = parseInt(rangeMatchSimple[1], 10);
      const endDay = parseInt(rangeMatchSimple[2], 10);
      const monthStr = rangeMatchSimple[3].toLowerCase();
      const month = MONTHS_MAP[monthStr] ?? 0;

      for (let dVal = startDay; dVal <= endDay; dVal++) {
        const m = String(month + 1).padStart(2, '0');
        const d = String(dVal).padStart(2, '0');
        parsedDates.push(`${year}-${m}-${d}`);
      }
    } else {
      const multiMatch = datePart.match(/(\d+)\s*(?:&|and|,)\s*(\d+)\s+([A-Za-z]+)/i);
      if (multiMatch) {
        const day1 = parseInt(multiMatch[1], 10);
        const day2 = parseInt(multiMatch[2], 10);
        const monthStr = multiMatch[3].toLowerCase();
        const month = MONTHS_MAP[monthStr] ?? 0;

        const m = String(month + 1).padStart(2, '0');
        parsedDates.push(`${year}-${m}-${String(day1).padStart(2, '0')}`);
        parsedDates.push(`${year}-${m}-${String(day2).padStart(2, '0')}`);
      } else {
        const singleMatch = datePart.match(/(\d+)\s+([A-Za-z]+)/i);
        if (singleMatch) {
          const day = parseInt(singleMatch[1], 10);
          const monthStr = singleMatch[2].toLowerCase();
          const month = MONTHS_MAP[monthStr];

          if (month !== undefined) {
            const m = String(month + 1).padStart(2, '0');
            parsedDates.push(`${year}-${m}-${String(day).padStart(2, '0')}`);
          }
        }
      }
    }

    for (const d of parsedDates) {
      if (!results.some(r => r.date === d)) {
        results.push({
          date: d,
          name: name,
          isWorkingDay: false
        });
      }
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    holidayParseSchema.parse(rawBody);
    const { text, fileData, fileType, year } = rawBody;
    const defaultYear = year ? parseInt(String(year), 10) : 2026;
    
    let parsedHolidays: ParsedHoliday[] = [];
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && (fileData || (text && text.length > 500))) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `You are a professional calendar parser. Parse the provided list of government holidays for the year ${defaultYear}. 
Return a JSON array of holiday objects. Each object MUST have precisely these keys:
- "date": string in YYYY-MM-DD format
- "name": string containing the name of the holiday (in Bengali or English as provided)
- "isWorkingDay": boolean, set to false.

If a holiday spans multiple days (e.g. Eid-ul-Fitr block 19 March to 23 March), you must generate separate objects for EACH day in that range.
If a line lists multiple separate dates (e.g. 20 & 21 October), generate separate objects for each date.

Provide only the JSON array as output, no markdown wrappers, no formatting, just raw JSON.`;

        let result;
        if (fileData) {
          const base64Data = fileData.split(',')[1] || fileData;
          result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: fileType || 'application/pdf'
              }
            }
          ]);
        } else {
          result = await model.generateContent([prompt, "\n\nHoliday Text Data:\n", text]);
        }

        const responseText = result.response.text().trim();
        parsedHolidays = JSON.parse(responseText);
        
        if (Array.isArray(parsedHolidays)) {
          parsedHolidays = parsedHolidays.map(item => ({
            date: item.date,
            name: item.name || 'সরকারি ছুটি',
            isWorkingDay: !!item.isWorkingDay
          })).sort((a, b) => a.date.localeCompare(b.date));
        } else {
          throw new Error('AI returned non-array structure');
        }
      } catch (aiError) {
        logger.error('AI parsing failed, falling back to regex parser:', aiError);
        parsedHolidays = fallbackParseHolidays(text || '', defaultYear);
      }
    } else {
      parsedHolidays = fallbackParseHolidays(text || '', defaultYear);
    }

    return NextResponse.json({ success: true, holidays: parsedHolidays });
  } catch (error) {
    logger.error('Error parsing holidays:', error);
    return NextResponse.json({ error: 'failed_to_parse_holidays', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
