import os

txt_path = "scratch/roster_1093.txt"
if os.path.exists(txt_path):
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    print("Length of txt:", len(content))
    print("onDrop in txt:", 'ondrop' in content.lower())
    print("drag in txt:", 'drag' in content.lower())
    print("viewMode in txt:", 'viewmode' in content.lower())
else:
    print("File not found!")
