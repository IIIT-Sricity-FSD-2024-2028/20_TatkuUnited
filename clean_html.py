import os
import re

html_dir = r"d:\IIITSSS\FFSD\Project\20_TatkuUnited\front-end\html"

# Common patterns to remove
notification_link_pattern1 = re.compile(r'<a href="notifications?\.html".*?</a>', re.DOTALL | re.IGNORECASE)
notification_button_pattern = re.compile(r'<button class="notif-btn".*?</button>', re.DOTALL | re.IGNORECASE)

change_photo_patterns = [
    re.compile(r'<button [^>]*class="[^"]*change-photo[^"]*"[^>]*>.*?</button>', re.DOTALL | re.IGNORECASE),
    re.compile(r'<button [^>]*id="[^"]*changePhoto[^"]*"[^>]*>.*?</button>', re.DOTALL | re.IGNORECASE),
    re.compile(r'<a [^>]*class="[^"]*change-photo[^"]*"[^>]*>.*?</a>', re.DOTALL | re.IGNORECASE),
    re.compile(r'<div class="change-photo.*?</div>', re.DOTALL | re.IGNORECASE),
    re.compile(r'<button class="btn-outline btn-sm">Change Photo</button>', re.DOTALL | re.IGNORECASE)
]

for root, dirs, files in os.walk(html_dir):
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()

            original_content = content
            
            # Remove notifications href entirely block if it is inside nav or sidebar. Wait, just let's remove <a ...> ... </a> block if href="notifications.html"
            content = re.sub(r'\s*<a href="notifications?\.html"[^>]*>.*?</a>', '', content, flags=re.DOTALL)
            content = re.sub(r'\s*<button class="notif-btn"[^>]*>.*?</button>', '', content, flags=re.DOTALL)
            
            # Remove change photo options
            for pattern in change_photo_patterns:
                content = re.sub(pattern, '', content)

            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f"Updated {filepath}")
