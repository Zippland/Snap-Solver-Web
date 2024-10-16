import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 用于显示处理进度

  const handleFileChange = async (event) => {
    const file = event.target.files[0];  // 获取用户选择的文件

    if (!file) {
      console.error('No file selected');
      return;
    }

    setLoading(true);
    setProgress(0); // 初始化进度

    const formData = new FormData();
    formData.append('file', file);  // 将文件添加到 FormData 对象

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('文件上传失败');
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error uploading image:', error);
      setAnswer('上传失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  // 模拟进度更新，替换为后端的进度反馈机制
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 20 : 100));
      }, 1000);

      return () => clearInterval(interval); // 清理定时器
    }
  }, [loading]);

  return (
    <div className={styles.container}>
      <h1>GPT-4 中文解答</h1>
      <input type="file" onChange={handleFileChange} /> {/* 文件上传控件 */}
      {loading ? (
        <div>
          <p>正在处理图片，请稍候...</p>
          <progress value={progress} max="100">{progress}%</progress> {/* 显示进度条 */}
        </div>
      ) : (
        <div className={styles.answerBox}>
          <p className={styles.text}>{answer ? answer : '请上传图片以获取答案。'}</p>
        </div>
      )}
    </div>
  );
}
