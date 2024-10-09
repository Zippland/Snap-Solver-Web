import os
import time
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# 设置要监控的截图文件夹路径
folder_path = 'D:\BaiduSyncdisk\Screenshots'
# 上传到 Vercel 服务器的 URL
server_url = 'https://your-vercel-app.vercel.app/api/upload'

class ScreenshotHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return None
        if event.src_path.endswith(".png"):
            print(f"New screenshot detected: {event.src_path}")
            upload_image(event.src_path)

def upload_image(image_path):
    with open(image_path, 'rb') as image_file:
        files = {'file': image_file}
        response = requests.post(server_url, files=files)
        if response.status_code == 200:
            print("Image uploaded successfully!")
        else:
            print(f"Failed to upload image. Status code: {response.status_code}")

if __name__ == "__main__":
    event_handler = ScreenshotHandler()
    observer = Observer()
    observer.schedule(event_handler, folder_path, recursive=False)
    observer.start()

    print(f"Monitoring folder: {folder_path}")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
