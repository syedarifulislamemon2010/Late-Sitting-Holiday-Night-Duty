import os
print("File exists:", os.path.exists("scratch/roster_step_1093.json"))
if os.path.exists("scratch/roster_step_1093.json"):
    print("Size:", os.path.getsize("scratch/roster_step_1093.json"))
