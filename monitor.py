import os
import time
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# 设置要监控的截图文件夹路径
folder_path = r'D:\\BaiduSyncdisk\\Screenshots'
# 上传到本地服务器的 URL
server_url = 'https://snap-solver.vercel.app/api/upload'

class ScreenshotHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return None
        if event.src_path.endswith(".png"):
            print(f"New screenshot detected: {event.src_path}")
            
            # 等待几秒，确保截图文件写入完成
            time.sleep(2)  # 等待2秒（根据需要调整）
            upload_image(event.src_path)

def upload_image(image_path):
    try:
        with open(image_path, 'rb') as image_file:
            files = {'file': (os.path.basename(image_path), image_file, 'image/png')}  # 确保 'file' 字段名与后端一致
            response = requests.post(server_url, files=files)  # 使用 files 参数上传图片
            if response.status_code == 200:
                print("Image uploaded successfully!")
            else:
                print(f"Failed to upload image. Status code: {response.status_code}")
    except PermissionError as e:
        print(f"PermissionError: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

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
