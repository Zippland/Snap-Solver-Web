import formidable from 'formidable';
import openai from 'openai';
import fs from 'fs';

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
        return res.status(500).json({ error: 'File upload failed' });
      }

      console.log('解析的文件信息:', files);  // 打印文件解析结果以调试

      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;  // 处理文件为数组的情况
      if (!uploadedFile) {
        console.error('未找到上传的文件');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = uploadedFile.filepath || uploadedFile.path;

      if (!filePath) {
        console.error('未找到文件路径');
        return res.status(500).json({ error: 'Failed to retrieve file path' });
      }

      // 调用 OpenAI GPT-4 进行图片分析
      const apiKey = process.env.OPENAI_API_KEY;
      openai.apiKey = apiKey;

      const imageStream = fs.createReadStream(filePath);  // 读取上传的文件

      try {
        const response = await openai.createImage({
          model: "gpt-40-2024-08-06",
          file: imageStream,
          prompt: "请分析并解决这张图片中的问题，用中文回答。",
        });

        const gptAnswer = response.data;  // 获取 GPT-4 的中文解答

        // 将解答返回给前端
        res.status(200).json({ answer: gptAnswer });
      } catch (error) {
        console.error('Error with GPT-4:', error);
        res.status(500).json({ error: 'Error with GPT-4 processing' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default handler;
