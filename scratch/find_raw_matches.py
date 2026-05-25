import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"
out_path = r"e:\Late-Sitting-Holiday-Night-Duty\scratch\matches.txt"

matches = []

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        # We can search the raw line directly!
        if any(x in line for x in ["orderRef", "memoNo", "সূত্রঃ", "স্মারক"]):
            # Find a preview of the line
            matches.append(f"Line {idx}: {line[:300]}...")

with open(out_path, 'w', encoding='utf-8') as out_f:
    out_f.write('\n'.join(matches))

print(f"Wrote {len(matches)} matches to {out_path}")
