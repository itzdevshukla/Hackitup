import re
import os

files = [
    'challenges/api_views.py',
    'administration/api_views.py'
]

keys = ['id', 'event_id', 'challenge_id', 'user_id', 'wave_id', 'hint_id', 'announcement_id', 'file_id']
# Regex: matches "id": user.id, 'event_id': event.id
pattern = re.compile(r"(['\"](?:%s)['\"]\s*:\s*)([a-zA-Z0-9_\.\[\]\(\) ]+?)(?=[,\n\}])" % '|'.join(keys))

def repl(m):
    key_part = m.group(1)
    val_part = m.group(2).strip()
    
    # Skip if it's already encoded
    if val_part.startswith('encode_id(') or val_part.startswith("'") or val_part.startswith('"') or val_part == 'None':
         return m.group(0)
    
    return f"{key_part}encode_id({val_part})"

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = pattern.sub(repl, content)
    
    if 'from ctf.utils import encode_id' not in new_content:
        # insert near the top
        lines = new_content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('from ') or line.startswith('import '):
                lines.insert(i, 'from ctf.utils import encode_id')
                break
        new_content = '\n'.join(lines)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print('Regex replace done.')
