import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 1093:
                # This is the VIEW_FILE step! Let's write its full JSON to a scratch file
                with open('scratch/roster_step_1093.json', 'w', encoding='utf-8') as outf:
                    json.dump(data, outf, indent=2, ensure_ascii=False)
                print("Successfully dumped step 1093 to scratch/roster_step_1093.json!")
                break
        except Exception as e:
            pass
