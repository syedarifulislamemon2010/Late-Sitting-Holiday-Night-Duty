import json
import os

txt_path = "scratch/roster_1093.txt"
target_path = "src/app/roster/page.tsx"

if os.path.exists(txt_path):
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Wait, the content inside VIEW_FILE response starts with something like:
    # "File Path: ...\nTotal Lines: ...\nTotal Bytes: ...\nShowing lines ...\n"
    # and has line numbers like "1: 'use client';\n2: \n3: import..."
    # Let's clean it up!
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        if line.startswith("File Path:") or line.startswith("Total Lines:") or line.startswith("Total Bytes:") or line.startswith("Showing lines") or line.startswith("The following code has been modified"):
            continue
        # Remove line numbers like "1: " or "10: "
        if ":" in line:
            parts = line.split(":", 1)
            # Check if the left part is a digit
            if parts[0].strip().isdigit():
                # It is a line number! Let's strip the leading space after the colon
                cleaned_line = parts[1]
                if cleaned_line.startswith(" "):
                    cleaned_line = cleaned_line[1:]
                cleaned_lines.append(cleaned_line)
                continue
        # If it doesn't match, keep it (though usually all lines in view_file have line numbers)
        cleaned_lines.append(line)
        
    cleaned_content = "\n".join(cleaned_lines)
    
    # Write to target path
    with open(target_path, 'w', encoding='utf-8') as out:
        out.write(cleaned_content)
    print(f"Successfully restored {target_path} from {txt_path}!")
else:
    print(f"Error: {txt_path} does not exist!")
