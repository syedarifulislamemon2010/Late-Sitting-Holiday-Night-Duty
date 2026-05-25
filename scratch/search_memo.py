import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            content = step.get("content", "")
            # Let's search for "স্মারক" or "সূত্র"
            if "স্মারক" in content or "সূত্র" in content:
                for line_code in content.split('\n'):
                    if ("স্মারক" in line_code or "সূত্র" in line_code) and len(line_code) < 150:
                        print(f"Step {step.get('step_index')}: {line_code.strip()}")
        except Exception as e:
            pass
