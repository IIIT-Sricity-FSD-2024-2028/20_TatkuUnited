import os
import re
import json

base_dir = r"d:\IIITSSS\FFSD\Project\20_TatkuUnited\front-end"
html_dir = os.path.join(base_dir, "html")
mock_data_path = os.path.join(base_dir, "js", "data", "mockData.json")

# 1. Update mockData.json directly
try:
    with open(mock_data_path, "r", encoding="utf-8-sig") as f:
        mock_data = json.load(f)

    # Clean pfp_urls in any array we can find
    for key, value in mock_data.items():
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict) and "pfp_url" in item:
                    item["pfp_url"] = None

    with open(mock_data_path, "w", encoding="utf-8") as f:
        json.dump(mock_data, f, indent=2)
    print("Cleaned pfp_url from mockData.json")
except Exception as e:
    print("Error processing mockData.json:", e)

# 2. Re-read HTML files specifically targeting the notification icon.
# The user mentioned: "the header still contains the notification icon". Let's also check for any svg or icon paths.
# Let's target the exact blocks that were missed before.
    
notif_patterns = [
    re.compile(r'<a[^>]*href="notifications?\.html"[^>]*>.*?</a>', re.DOTALL | re.IGNORECASE),
    re.compile(r'<button[^>]*class="notif-btn"[^>]*>.*?</button>', re.DOTALL | re.IGNORECASE),
    re.compile(r'<a[^>]*title="Notifications"[^>]*>.*?</a>', re.DOTALL | re.IGNORECASE),
    re.compile(r'<button[^>]*title="Notifications"[^>]*>.*?</button>', re.DOTALL | re.IGNORECASE),
]

roles_map = {
    "super_user": "Super User",
    "collective_manager": "Collective Manager",
    "unit_manager": "Unit Manager",
    "provider": "Service Provider",
    "customer": "Customer"
}

for root, dirs, files in os.walk(html_dir):
    role_name = None
    for folder, friendly_name in roles_map.items():
        if f"\\{folder}\\" in root or root.endswith(f"\\{folder}"):
            role_name = friendly_name
            break

    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            original_content = content

            # Remove notifications
            for pattern in notif_patterns:
                content = re.sub(pattern, '', content)

            if role_name:
                # Target the topbar username specifically
                content = re.sub(
                    r'<span\s+class="user-name"[^>]*>.*?</span>',
                    f'<span class="user-name">{role_name}</span>',
                    content,
                    flags=re.DOTALL | re.IGNORECASE
                )
            
            if content != original_content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Updated HTML: {filepath}")

# Let's also enforce it in manage_skills.html just in case.
