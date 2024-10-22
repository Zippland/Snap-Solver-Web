require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // 引入 CORS 中间件
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// 使用 CORS 中间件允许跨域请求
app.use(cors({
    origin: ['https://snap-solver.vercel.app', 'https://snap-solver-test.vercel.app'], // 允许的前端域名
    methods: ['GET', 'POST'], // 允许的 HTTP 方法
    allowedHeaders: ['Content-Type'], // 允许的头部
    credentials: true // 如果前端需要携带跨域 Cookie
}));

// Socket.IO 配置 CORS
const io = new Server(server, {
    cors: {
        origin: ['https://snap-solver.vercel.app', 'https://snap-solver-test.vercel.app'], // 允许的前端域名
        methods: ['GET', 'POST'],
        credentials: true // 允许跨域 Cookie 传递（如果有需要）
    },
    transports: ['polling'] // 强制使用 HTTP 长轮询
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let savedCropSettings = null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '100mb' }));

// 路由：保存裁剪设置并处理图片
app.post('/save-crop-settings-and-process', async (req, res) => {
    const { cropSettings, image } = req.body;
    try {
        savedCropSettings = req.body.cropSettings;

        const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        let img = sharp(buffer);
        const metadata = await img.metadata();
        const imgWidth = metadata.width;
        const imgHeight = metadata.height;

        const cropX = Math.max(0, Math.min(Math.round(savedCropSettings.x), imgWidth));
        if (cropX + savedCropSettings.width > imgWidth) {
            savedCropSettings.width = imgWidth - cropX;
        }
        const cropY = Math.max(0, Math.min(Math.round(savedCropSettings.y), imgHeight));
        if (cropY + savedCropSettings.height > imgHeight) {
            savedCropSettings.height = imgHeight - cropY;
        }
        const cropWidth = Math.max(1, Math.min(Math.round(savedCropSettings.width), imgWidth - cropX));
        const cropHeight = Math.max(1, Math.min(Math.round(savedCropSettings.height), imgHeight - cropY));

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
                            text: '请解答途中的题目。如果是选择题，请先仔细分析题目中的每一个选项，然后给我正确答案。'
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
        });

        const gptAnswer = gptResponse.data.choices[0].message.content;
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
