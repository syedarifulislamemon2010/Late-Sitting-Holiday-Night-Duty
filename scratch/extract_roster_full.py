import json
import re

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'roster' in line.lower() and 'page.tsx' in line.lower():
            try:
                data = json.loads(line)
                step = data.get('step_index')
                t = data.get('type')
                tc_list = data.get('tool_calls', [])
                for tc in tc_list:
                    name = tc.get('name')
                    args = tc.get('arguments', {})
                    if 'roster' in str(args).lower():
                        print(f"Line {i} Step {step}: Tool={name}, args keys={list(args.keys())}")
                        # If it is write_to_file, let's dump the CodeContent length
                        if name == 'default_api:write_to_file' and 'CodeContent' in args:
                            print(f"  CodeContent length: {len(args['CodeContent'])}")
                            with open(f"scratch/roster_write_step_{step}.tsx", 'w', encoding='utf-8') as out:
                                out.write(args['CodeContent'])
                            print(f"  Dumped CodeContent to scratch/roster_write_step_{step}.tsx")
            except Exception as e:
                pass
