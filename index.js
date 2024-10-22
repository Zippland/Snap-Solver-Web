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

// 路由：保存裁剪设置并提取文本
app.post('/save-crop-settings-and-process', async (req, res) => {
    const { cropSettings, image } = req.body;
    console.log('Received Crop Settings:', cropSettings); // 输出接收到的裁剪数据以验证是否正确

    try {
        // 保存裁剪设置
        savedCropSettings = cropSettings;

        const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        let img = sharp(buffer);
        const metadata = await img.metadata();
        const imgWidth = metadata.width;
        const imgHeight = metadata.height;

        // 验证裁剪区域是否在图片范围内
        const cropX = Math.max(0, Math.min(Math.round(savedCropSettings.x), imgWidth));
        const cropY = Math.max(0, Math.min(Math.round(savedCropSettings.y), imgHeight));

        if (cropX + savedCropSettings.width > imgWidth) {
            console.error('Crop width exceeds image width. Adjusting to fit within bounds.');
            savedCropSettings.width = imgWidth - cropX;
        }
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

        // **步骤1：使用“gpt-4o-mini”模型提取图片中的文本**
        const extractTextResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/png;base64,${base64CroppedImage}`
                            }
                        },
                        {
                            type: 'text',
                            text: '请按格式提取这张图片中的所有内容，一字不落。'
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

        // 获取提取的文本
        const extractedText = extractTextResponse.data.choices[0].message.content.trim();
        console.log('Extracted Text:', extractedText);

        // 将提取的文本返回给前端
        res.json({ extractedText });
    } catch (err) {
        console.error('Error processing image or GPT request:', err);
        res.status(500).send('An error occurred while processing the image or GPT request.');
    }
});

// **新增路由：直接使用图片解题**
app.post('/solve-problem-with-image', async (req, res) => {
    const { cropSettings, image } = req.body;

    try {
        const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        let img = sharp(buffer);

        // 获取图片的元数据
        const metadata = await img.metadata();
        const imgWidth = metadata.width;
        const imgHeight = metadata.height;

        const cropX = Math.max(0, Math.min(Math.round(cropSettings.x), imgWidth));
        const cropY = Math.max(0, Math.min(Math.round(cropSettings.y), imgHeight));

        if (cropX + cropSettings.width > imgWidth) {
            cropSettings.width = imgWidth - cropX;
        }
        if (cropY + cropSettings.height > imgHeight) {
            cropSettings.height = imgHeight - cropY;
        }

        const cropWidth = Math.max(1, Math.min(Math.round(cropSettings.width), imgWidth - cropX));
        const cropHeight = Math.max(1, Math.min(Math.round(cropSettings.height), imgHeight - cropY));

        // 裁剪图片
        img = img.extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight });

        const croppedImageBuffer = await img.png().toBuffer();
        const base64CroppedImage = croppedImageBuffer.toString('base64');

        // 使用“gpt-4o-2024-08-06”模型解题
        const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-2024-08-06',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/png;base64,${base64CroppedImage}`
                            }
                        },
                        {
                            type: 'text',
                            text: '请解答图中的题目。如果是选择题，请先仔细分析题目中的每一个选项，然后给我正确答案。'
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

        // 获取 GPT 的回答
        const gptAnswer = gptResponse.data.choices[0].message.content.trim();

        // 返回答案给前端
        res.json({ answer: gptAnswer });
    } catch (err) {
        console.error('Error solving problem with image:', err);
        res.status(500).send('An error occurred while solving the problem with image.');
    }
});

// **原有路由：解题**
app.post('/solve-problem', async (req, res) => {
    const { extractedText } = req.body;

    try {
        // **步骤2：使用“gpt-4o-2024-08-06”模型解题**
        const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-2024-08-06',
            messages: [
                {
                    role: 'user',
                    content: `请解答以下题目。如果是选择题，请先仔细分析题目中的每一个选项，然后给我正确答案。\n\n${extractedText}`
                }
            ],
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // 获取 GPT 的回答
        const gptAnswer = gptResponse.data.choices[0].message.content.trim();

        // 返回答案给前端
        res.json({ answer: gptAnswer });
    } catch (err) {
        console.error('Error calling GPT API:', err);
        res.status(500).send('An error occurred while solving the problem.');
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
