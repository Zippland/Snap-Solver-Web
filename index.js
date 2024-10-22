// index.js（后端服务器）
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp'); // 用于图片裁剪
const axios = require('axios'); // 用于请求 GPT API

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 用于保存上传文件的设置
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let savedCropSettings = null; // 存储裁剪设置，初始化为空

// 创建静态文件夹，存放图片
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '100mb' }));

// 路由：保存裁剪设置并处理图片
app.post('/save-crop-settings-and-process', async (req, res) => {
    const { cropSettings, image } = req.body;
    console.log('Received Crop Settings:', cropSettings); // 输出接收到的裁剪数据以验证是否正确
    try {
        // 保存裁剪设置
        savedCropSettings = req.body.cropSettings; // 更新保存的裁剪设置

        const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      let img = sharp(buffer);
      const metadata = await img.metadata();
      const imgWidth = metadata.width;
      const imgHeight = metadata.height;
      
      // 验证裁剪区域是否在图片范围内
      const cropX = Math.max(0, Math.min(Math.round(savedCropSettings.x), imgWidth));
      if (cropX + savedCropSettings.width > imgWidth) {
          console.error('Crop width exceeds image width. Adjusting to fit within bounds.');
          savedCropSettings.width = imgWidth - cropX;
      }
      const cropY = Math.max(0, Math.min(Math.round(savedCropSettings.y), imgHeight));
      if (cropY + savedCropSettings.height > imgHeight) {
          console.error('Crop height exceeds image height. Adjusting to fit within bounds.');
          savedCropSettings.height = imgHeight - cropY;
      }
      const cropWidth = Math.max(1, Math.min(Math.round(savedCropSettings.width), imgWidth - cropX));
      const cropHeight = Math.max(1, Math.min(Math.round(savedCropSettings.height), imgHeight - cropY));
      
      // 裁剪图片
      img = img.extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight });

        const croppedImageBuffer = await img.png().toBuffer();
        const base64CroppedImage = croppedImageBuffer.toString('base64');

        // 调用 GPT 服务进行解答
        const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: '请解答途中的题目。如果是选择题，请先仔细分析题目中的每一个选项，然后给我正确答案.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/png;base64,${base64CroppedImage}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }).catch(err => {
            console.error('Error calling GPT API:', err);
            if (err.response && err.response.status === 401) {
                throw new Error('Unauthorized request. Please check your OpenAI API key.');
            }
            throw new Error('Failed to get response from GPT API.');
        });

        // 获取 GPT 的回答
        const gptAnswer = gptResponse.data.choices[0].message.content;

        // 返回答案给前端
        res.json({ answer: gptAnswer });
    } catch (err) {
        console.error('Error processing image or GPT request:', err);
        res.status(500).send('An error occurred while processing the image or GPT request.');
    }
});

// 路由：处理截图上传并通知前端进行裁剪设置
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const base64Image = req.file.buffer.toString('base64');
        io.emit('new_image_uploaded', { image: base64Image });
        res.send('Initial image uploaded. Waiting for crop settings.');
    } catch (err) {
        console.error('Error uploading the image:', err);
        res.status(500).send('An error occurred while uploading the image.');
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
