import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (event) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', event.target.files[0]);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>GPT-4 中文解答</h1>
      <input type="file" onChange={handleUpload} />
      {loading ? (
        <p>正在处理图片，请稍候...</p>
      ) : (
        <div className={styles.answerBox}>
          <p>{answer ? answer : '请上传图片以获取答案。'}</p>
        </div>
      )}
    </div>
  );
}
