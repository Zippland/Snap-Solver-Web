import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import openai from 'openai';

export const config = {
  api: {
    bodyParser: false, // 禁用 bodyParser 以处理文件上传
  },
};

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // 确保 uploads 文件夹存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 解析上传文件
    form.uploadDir = uploadDir;
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'File upload failed' });
      }

      const filePath = files.file.path;

      // 调用 OpenAI GPT-4 进行图片分析
      const apiKey = process.env.OPENAI_API_KEY;
      const image = fs.createReadStream(filePath);

      const response = await openai.createImage({
        model: "gpt-4-vision",
        file: image,
        prompt: "请分析并解决这张图片中的问题，用中文回答。",
      });

      const gptAnswer = response.data;

      // 存储 GPT 的答案（保存到本地文本文件，或者直接返回给前端）
      fs.writeFileSync(path.join(uploadDir, 'answer.txt'), gptAnswer);

      res.status(200).json({ message: 'Image uploaded and processed', answer: gptAnswer });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default handler;
