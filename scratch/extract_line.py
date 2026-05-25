import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 1093:
            try:
                data = json.loads(line)
                print("Line 1093 loaded successfully!")
                print("Keys:", list(data.keys()))
                print("Type:", data.get('type'))
                # If there's content, let's write it to e:\Late-Sitting-Holiday-Night-Duty\scratch\roster_1093.txt
                content = data.get('content', '')
                if content:
                    with open(r"scratch/roster_1093.txt", 'w', encoding='utf-8') as out:
                        out.write(content)
                    print("Wrote content to scratch/roster_1093.txt")
                else:
                    print("No content key in line 1093")
            except Exception as e:
                print("Error loading:", e)
            break
