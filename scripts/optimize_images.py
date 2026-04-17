import os
from PIL import Image

def optimize_image(source_path):
    target_path = os.path.splitext(source_path)[0] + '.webp'
    
    try:
        with Image.open(source_path) as img:
            # For PNGs with transparency, we still use WebP lossy but keep alpha
            # For JPGs, we use lossy quality=85
            img.save(target_path, 'WEBP', quality=85, method=6) # method 6 is slowest/best compression
        
        source_size = os.path.getsize(source_path)
        target_size = os.path.getsize(target_path)
        
        print(f"Converted: {os.path.basename(source_path)}")
        os.remove(source_path) 
            
    except Exception as e:
        print(f"Failed to convert {os.path.basename(source_path)}: {e}")

if __name__ == "__main__":
    dirs_to_optimize = [
        os.path.join('public', 'assets'),
        os.path.join('public', 'members'),
        os.path.join('src', 'assets')
    ]
    
    for d in dirs_to_optimize:
        if os.path.exists(d):
            print(f"Scanning: {d}")
            for root, _, files in os.walk(d):
                for file in files:
                    if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                        optimize_image(os.path.join(root, file))
        else:
            print(f"Directory not found: {d}")
