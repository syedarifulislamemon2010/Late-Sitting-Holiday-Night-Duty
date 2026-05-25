import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            idx = step.get("step_index")
            # If the step is VIEW_FILE and contains billing/page.tsx
            # Let's inspect step 183 first:
            if idx == 183 or idx == 197 or idx == 247:
                print(f"--- STEP {idx} ---")
                content = step.get("content", "")
                print(f"Content snippet: {content[:200]}")
                # Save to a file
                out_path = f"scratch/billing_step_{idx}.txt"
                with open(out_path, 'w', encoding='utf-8') as out_f:
                    out_f.write(content)
                print(f"Wrote to {out_path}")
        except Exception as e:
            print(f"Error: {e}")
