import urllib.request
import zipfile
import os

def main():
    url = "https://github.com/git-for-windows/git/releases/download/v2.45.0.windows.1/MinGit-2.45.0-64-bit.zip"
    zip_path = r"C:\Users\HP\.gemini\antigravity\scratch\mingit.zip"
    dest_path = r"C:\Users\HP\.gemini\antigravity\scratch\git-portable"
    
    print(f"Downloading MinGit from: {url}")
    os.makedirs(os.path.dirname(zip_path), exist_ok=True)
    
    # Download
    urllib.request.urlretrieve(url, zip_path)
    print("Download completed. Extracting files...")
    
    # Extract
    os.makedirs(dest_path, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(dest_path)
        
    # Clean up zip
    os.remove(zip_path)
    print(f"MinGit extracted successfully to: {dest_path}")

if __name__ == "__main__":
    main()
