import keyboard
from PIL import ImageGrab
import io
import requests

def take_screenshot():
    # 截屏，不触发保存界面
    screenshot = ImageGrab.grab()

    # 将截图保存为内存中的字节流，而不是本地文件
    img_byte_arr = io.BytesIO()
    screenshot.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)  # 将文件指针移动到开头

    # 上传图片到服务器
    files = {'file': ('screenshot.png', img_byte_arr, 'image/png')}
    try:
        response = requests.post('http://privatesnapsolver.vercel.app/upload', files=files)
        if response.status_code == 200:
            print("Screenshot uploaded successfully")
        else:
            print(f"Failed to upload screenshot, status code: {response.status_code}")
    except Exception as e:
        print(f"An error occurred: {e}")

# 监听热键，比如 alt+ctrl+s
keyboard.add_hotkey('alt+ctrl+s', take_screenshot)

# 程序持续运行，等待用户按下热键
keyboard.wait('esc')  # 用户按 ESC 退出监听
