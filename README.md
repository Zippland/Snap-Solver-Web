# Snap-Solver

Snap-Solver 是一个可以通过电脑截屏并在移动设备上查看与处理截图的应用程序。本项目实现了截图上传、裁剪、并调用 GPT 进行解答的功能。

## 功能介绍

- **截图上传**：通过本地程序截屏后，图片将被上传到服务器。
- **裁剪处理**：用户可以在网页上选择图片的裁剪区域。
- **GPT 解答**：裁剪后的截图会发送到 GPT 进行题目解答。

## 目录结构

```
Snap-Solver/
├── public/
│   └── index.html  # 前端界面
├── index.js        # 后端服务器
├── snap.py         # 本地截屏程序
├── .env            # 环境变量文件（需配置 GPT API Key）
└── README.md       # 项目说明文件
```

## 前端技术

- **HTML/CSS/JavaScript**：使用 HTML 和 CSS 创建了简洁的用户界面，并通过 JavaScript 实现功能交互。
- **Cropper.js**：用于裁剪图片的第三方库。
- **Socket.io**：用于前后端实时通信，传递图片和裁剪数据。

## 后端技术

- **Node.js & Express**：服务器端框架，用于处理上传的截图和裁剪区域的保存。
- **Multer**：用于处理多部分表单数据（图片上传）。
- **Sharp**：处理和裁剪图片。
- **OpenAI API**：调用 GPT 进行图片内题目的解答。

## 使用步骤

### 1. 本地部署

1. **本地配置**：
   - 安装所需依赖：`npm install`
   - 在项目根目录创建 `.env` 文件并添加 OpenAI API Key：
     ```
     OPENAI_API_KEY=your_openai_api_key
     ```

2. **启动服务器**：
   - 使用命令 `node index.js` 启动后端服务器，默认运行在端口 3000。

3. **截图上传**：
   - 使用本地 `snap.py` 脚本截屏并上传到服务器。
   - 监听 `Alt+Ctrl+S` 组合键来截屏。

4. **裁剪图片并解答**：
   - 在网页界面中裁剪上传的截图。
   - 点击 "保存裁剪区域" 按钮，服务器将自动处理图片并调用 GPT 进行解答，答案将显示在网页中。

### 2. 在 Vercel 上部署

#### 一键部署

点击以下按钮即可一键将项目部署到 Vercel：

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Zippland/Snap-Solver&env=OPENAI_API_KEY&envDescription=Your%20OpenAI%20API%20Key%20needed%20to%20process%20the%20image%20content)

#### 部署步骤

1. 点击上面的 **Deploy to Vercel** 按钮。
2. 在跳转到的页面中，登录你的 Vercel 账号（如果还没有账号，先注册）。
3. 你将看到环境变量配置界面，输入你的 OpenAI API Key：
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```
4. 点击 **Deploy**，等待几分钟，Vercel 将自动完成部署。
5. 部署完成后，你将获得项目的 URL 地址，可以直接访问你的 Snap-Solver 应用。

## 技术要求

- Node.js 版本 14 以上
- Python 3.x（用于本地截图）

## 贡献

欢迎任何形式的贡献！如果你发现问题或有功能建议，欢迎通过 [GitHub](https://github.com/Zippland/Snap-Solver) 提交 issue 或 pull request。

## 许可证

本项目基于 MIT 许可证开源。