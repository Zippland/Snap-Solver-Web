import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { Configuration, OpenAIApi } from 'openai';

let status = 'idle';  // 用于保存状态
let gptAnswer = '';  // 保存 GPT 返回的答案

export const config = {
  api: {
    bodyParser: false,  // 禁用默认的 bodyParser 以处理 multipart/form-data
  },
};

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const form = formidable({
      multiples: false,  // 只处理单文件上传
      keepExtensions: true,  // 保留文件扩展名
      uploadDir: './uploads',  // 上传文件存放的目录
    });

    // 确保 ./uploads 目录存在
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
    }

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('文件上传解析失败:', err);
        status = 'error';
        res.status(500).json({ error: 'File upload failed' });
        return;
      }

      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!uploadedFile) {
        console.error('未找到上传的文件');
        status = 'error';
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const filePath = uploadedFile.filepath || uploadedFile.path;

      if (!filePath) {
        console.error('未找到文件路径');
        status = 'error';
        res.status(500).json({ error: 'Failed to retrieve file path' });
        return;
      }

      // 设置状态为“处理中”
      status = 'processing';

      // 立即推送状态更新
      res.writeHead(200, {
        'Content-Type': 'application/json',
      });
      res.write(JSON.stringify({ status: 'processing' }));
      res.end();

      // 调用 OpenAI GPT-4 进行图片分析
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,  // 使用环境变量中的 API 密钥
      });
      const openai = new OpenAIApi(configuration);  // 初始化 OpenAI 客户端

      const imageStream = fs.createReadStream(filePath);  // 读取上传的文件

      try {
        // 使用 OpenAI API 来分析图片
        const response = await openai.createImage({
          model: "gpt-4o-2024-08-06",
          file: imageStream,
          prompt: "请分析并解决这张图片中的问题，用中文回答。",
        });

        gptAnswer = response.data;  // 获取 GPT-4 的中文解答

        // 设置状态为“完成”
        status = 'completed';
      } catch (error) {
        console.error('Error with GPT-4:', error);
        status = 'error';
      } finally {
        // 无论处理是否成功，清空 uploads 文件夹
        clearUploadsFolder();
      }
    });
  } else if (req.method === 'GET') {
    // 处理 SSE 推送的状态
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const sendStatus = () => {
      res.write(`data: ${JSON.stringify({ status, answer: gptAnswer })}\n\n`);
    };

    sendStatus();
    const intervalId = setInterval(sendStatus, 1000);  // 每秒发送一次状态

    req.on('close', () => {
      clearInterval(intervalId);  // 关闭连接时清除定时器
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default handler;

// 清空上传文件夹的函数
const clearUploadsFolder = () => {
  const directory = './uploads';
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('读取 uploads 文件夹失败:', err);
      return;
    }

    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) {
          console.error('删除文件失败:', err);
        }
      });
    }
  });
};