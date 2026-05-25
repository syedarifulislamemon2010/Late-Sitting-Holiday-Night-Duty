import json
import re

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a3a4a40f-cc2c-42cb-a4e0-1f315896cbf3\.system_generated\logs\transcript.jsonl"

original_code = None

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            # Look for view_file or write_to_file of billing/page.tsx
            if "tool_calls" in step:
                for tc in step["tool_calls"]:
                    if tc.get("name") == "view_file" and "billing/page.tsx" in tc.get("args", {}).get("AbsolutePath", ""):
                        pass
            if step.get("type") == "VIEW_FILE" and "billing/page.tsx" in step.get("content", ""):
                content = step.get("content", "")
                if "export default function BillingPage" in content:
                    original_code = content
            # Also check if it's in the tool outputs
            if "billing/page.tsx" in str(step.get("tool_calls", [])):
                pass
        except Exception as e:
            pass

# Let's search by grep in a more robust way: search for lines containing "export default function BillingPage" and see
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if "export default function BillingPage" in line:
            # Found a step, let's extract the raw json to see what step it is
            try:
                data = json.loads(line)
                print(f"Step {data.get('step_index')} ({data.get('type')}) contains BillingPage")
                # Print the length of content
                if "content" in data:
                    print(f"Content length: {len(data['content'])}")
                # If there's tool calls and output
                if "tool_calls" in data:
                    for tc in data["tool_calls"]:
                        print(f"Tool call: {tc.get('name')}")
            except Exception as e:
                # Might be a truncated JSON or line
                print(f"Line {idx} error: {e}")

