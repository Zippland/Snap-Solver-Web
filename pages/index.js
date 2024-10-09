import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnswer = async () => {
      setLoading(true);
      try {
        const response = await fetch('/uploads/answer.txt');
        const data = await response.text();
        setAnswer(data);
      } catch (error) {
        console.error('Error fetching answer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswer();
  }, []);

  return (
    <div className={styles.container}>
      <h1>GPT-4 中文解答</h1>
      {loading ? (
        <p>正在处理图片，请稍候...</p>
      ) : (
        <div className={styles.answerBox}>
          <p>{answer ? answer : '还没有答案。请上传图片。'}</p>
        </div>
      )}
    </div>
  );
}
