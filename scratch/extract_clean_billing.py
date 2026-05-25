import json
import re

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"
out_path = r"e:\Late-Sitting-Holiday-Night-Duty\scratch\original_billing.tsx"

found_content = None

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            idx = step.get("step_index")
            # Step 183 was when we read the original billing/page.tsx
            if idx == 183:
                found_content = step.get("content", "")
                break
        except Exception as e:
            pass

if found_content:
    print("Found step 183 content! Processing...")
    # The content has lines like "1: 'use client';" or "10:   import { "
    # We want to extract only the code lines and strip the line numbers.
    lines = found_content.split('\n')
    clean_lines = []
    
    # Regex to match "<line_number>: <code_content>"
    pattern = re.compile(r'^\s*(\d+):\s(.*)$')
    
    for l in lines:
        match = pattern.match(l)
        if match:
            # Group 2 is the actual code content
            clean_lines.append(match.group(2))
        else:
            # If it doesn't match, check if it's part of header/footer of view_file
            if "Showing lines" in l or "File Path:" in l or "Total Lines:" in l or "The following code" in l or "The above content" in l:
                continue
            # Keep empty lines or other code lines if any
            clean_lines.append(l)
            
    clean_code = '\n'.join(clean_lines)
    
    # Save the reconstructed file
    with open(out_path, 'w', encoding='utf-8') as out_f:
        out_f.write(clean_code)
    print(f"Successfully reconstructed original billing page and saved to {out_path}")
else:
    print("Step 183 content not found in log!")
