log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'roster' in line.lower() and 'page.tsx' in line.lower():
            print(f"Line {i} contains roster & page.tsx. Length: {len(line)}")
            # Let's print the first 200 chars
            print("  Start:", line[:200])
