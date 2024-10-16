import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // 状态：'idle', 'loading', 'error', 'completed'
  const [statusMessage, setStatusMessage] = useState('等待上传图片...');
  const [iconColor, setIconColor] = useState('gray'); // 默认状态颜色
  const [uploadAllowed, setUploadAllowed] = useState(true); // 控制是否允许上传

  useEffect(() => {
    // 使用 Server-Sent Events (SSE) 监听后端状态更新
    const eventSource = new EventSource('/api/upload');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === 'processing') {
        setStatus('loading');
        setStatusMessage('正在处理图片...');
        setIconColor('yellow'); // 处理中
        setUploadAllowed(false); // 禁用手动上传
      } else if (data.status === 'completed') {
        setAnswer(data.answer);  // 设置GPT返回的答案
        setStatus('completed');
        setStatusMessage('处理完成');
        setIconColor('green'); // 处理完成
        setUploadAllowed(true); // 允许再次上传
      } else if (data.status === 'error') {
        setAnswer('处理失败，请稍后重试。');
        setStatus('error');
        setStatusMessage('处理失败');
        setIconColor('red'); // 错误
        setUploadAllowed(true); // 允许再次上传
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      setStatus('error');
      setStatusMessage('连接出错，无法获取状态。');
      setIconColor('red');
      setUploadAllowed(true); // 允许再次上传
    };

    return () => {
      eventSource.close(); // 关闭 SSE 连接
    };
  }, []);

  // 状态图标
  const StatusIcon = () => (
    <div className={styles.statusIcon} style={{ backgroundColor: iconColor }}></div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>图片处理系统 - GPT-4 解答</h1> {/* 程序名称 */}
      
      <div className={styles.statusContainer}>
        <StatusIcon /> {/* 显示状态的 icon */}
        <span className={styles.statusMessage}>{statusMessage}</span> {/* 显示状态文本 */}
      </div>
      
      {/* 当不允许上传时，禁用文件上传控件 */}
      <input type="file" onChange={handleFileChange} disabled={!uploadAllowed} />
      
      <div className={styles.answerBox}>
        <p className={styles.text}>{answer ? answer : '等待图片上传并处理...'}</p>
      </div>
    </div>
  );
}

// 文件上传处理函数
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  setStatus('loading');
  setStatusMessage('正在上传图片...');
  setIconColor('yellow'); // 设置状态颜色为黄色，表示正在上传

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'processing') {
        setStatusMessage('正在处理图片...');
        setIconColor('yellow'); // 设置状态颜色为黄色，表示处理中
      }
    } else {
      setStatus('error');
      setStatusMessage('上传失败，请重试。');
      setIconColor('red');
    }
  } catch (error) {
    console.error('文件上传错误:', error);
    setStatus('error');
    setStatusMessage('上传失败，请重试。');
    setIconColor('red');
  }
};