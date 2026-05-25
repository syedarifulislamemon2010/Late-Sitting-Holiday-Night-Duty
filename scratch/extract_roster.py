import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'roster' in line.lower() and 'page.tsx' in line.lower():
            try:
                data = json.loads(line)
                print(f"Line {i}: keys = {list(data.keys())}, type = {data.get('type')}, status = {data.get('status')}")
                if 'tool_calls' in data:
                    print("  Tool calls:", [tc.get('name') for tc in data['tool_calls']])
                if 'output' in data:
                    print("  Output length:", len(str(data['output'])))
            except Exception as e:
                print(f"Line {i} error: {e}")
