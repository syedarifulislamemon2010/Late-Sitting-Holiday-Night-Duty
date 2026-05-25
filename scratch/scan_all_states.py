import json
import re

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            content = step.get("content", "")
            # Let's search inside content for any occurrences of formula or text initializers
            if "useState" in content:
                for line_code in content.split('\n'):
                    if "useState" in line_code and any(x in line_code for x in ["orderRef", "memo", "Ref", "Memo", "সূত্র", "স্মারক", "issuingOffice"]):
                        print(f"Step {step.get('step_index')}: {line_code.strip()}")
            # Also check in tool_calls
            tool_calls = step.get("tool_calls", [])
            for tc in tool_calls:
                args_str = str(tc.get("args", {}))
                if "useState" in args_str:
                    for line_code in args_str.split('\n'):
                        if "useState" in line_code and any(x in line_code for x in ["orderRef", "memo", "Ref", "Memo", "সূত্র", "স্মারক", "issuingOffice"]):
                            print(f"Step {step.get('step_index')} (args): {line_code.strip()}")
        except Exception as e:
            pass
