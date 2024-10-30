# Snap-Solver-Web

Snap-Solver-Web 是 Snap-Solver 的云端部署版本，主要用于解决gpt和claude api在大陆的限制问题。

如果想部署在本地，并查看详细介绍，请访问项目：[Snap-Solver-local](https://github.com/zippland/snap-solver-local)

(产生本地部署需求的可能原因：希望无延迟截图上传)

## 功能介绍

- **截图上传**：通过本地程序截屏后，图片将被上传到服务器。
- **裁剪处理**：用户可以在网页上选择图片的裁剪区域。
- **GPT 解答**：裁剪后的截图会发送到 GPT 进行题目解答。

## 使用步骤

### 1. 在 Heroku 上部署

#### 部署步骤

1. 确保你已经安装了 [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) 并注册了 Heroku 帐号。
2. 在终端中登录到 Heroku：

   ```bash
   heroku login
   ```

3. 在你的项目根目录下，运行以下命令创建一个新的 Heroku 应用：

   ```bash
   heroku create
   ```

4. 将你的代码推送到 Heroku：

   ```bash
   git push heroku master
   ```

5. 设置 OpenAI API Key 作为环境变量：

   ```bash
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   ```

6. 部署完成后，运行以下命令打开你的 Heroku 应用：

   ```bash
   heroku open
   ```

7. 你可以通过 Heroku 提供的 URL 访问 Snap-Solver 应用。

#### 部署完成后的使用方法

在部署完成并访问 Heroku 应用后，你可以通过本地运行的 `snap.py` 程序截图，截图将自动上传到服务器并显示在移动设备的浏览器上。你可以裁剪截图，并提交给 GPT 进行解答。

### 2. 修改 `snap.py` 中的服务器网址和热键

#### 定位并修改上传网址

在 `snap.py` 中，你需要指定截图上传的服务器地址。默认的代码如下：

```python
response = requests.post('http://localhost:3000/upload', files=files)
```

如果你已将项目部署到 Heroku 上，请将 `localhost` 修改为你的 Heroku 应用 URL。例如，如果你的 Heroku 项目地址是 `https://your-app-name.herokuapp.com/`，请将上述代码修改为：

```python
response = requests.post('https://your-app-name.herokuapp.com/upload', files=files)
```

这样，本地截屏程序将截图上传到 Heroku 部署的服务器。

#### 修改截屏热键

`snap.py` 默认使用 `Alt+Ctrl+S` 作为截屏热键。你可以根据需要更改此组合键。找到以下代码：

```python
keyboard.add_hotkey('alt+ctrl+s', take_screenshot)
```

将 `alt+ctrl+s` 替换为你想要的组合键。例如，如果你想改为 `Alt+Shift+P`，可以这样修改：

```python
keyboard.add_hotkey('alt+shift+p', take_screenshot)
```

你可以参考 [keyboard](https://pypi.org/project/keyboard/) 模块的文档了解更多关于热键设置的信息。

## 技术要求

- Node.js 版本 14 以上
- Python 3.x（用于本地截图）

## 贡献

欢迎任何形式的贡献！如果你发现问题或有功能建议，欢迎通过 [GitHub](https://github.com/Zippland/Snap-Solver) 提交 issue 或 pull request。

## 许可证

本项目基于 MIT 许可证开源。
