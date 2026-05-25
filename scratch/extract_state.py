import json
import re

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            idx = step.get("step_index")
            if idx == 183 or idx == 197 or idx == 247:
                content = step.get("content", "")
                if "orderRef" in content or "memoNo" in content:
                    print(f"--- STEP {idx} ---")
                    # Search for state initializations
                    for line_code in content.split('\n'):
                        if "useState(" in line_code and ("orderRef" in line_code or "memoNo" in line_code or "issuingOffice" in line_code):
                            print(line_code)
        except Exception as e:
            pass
