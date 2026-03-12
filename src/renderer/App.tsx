import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('正在加载...')

  useEffect(() => {
    setMessage('🦊 Hello World from xclaw!')
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🦊</h1>
      <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>xclaw</h2>
      <p style={{ fontSize: '18px', opacity: 0.9 }}>OpenClaw 桌面客户端</p>
      <p style={{ marginTop: '40px', fontSize: '24px', fontWeight: 'bold' }}>
        {message}
      </p>
      <p style={{ marginTop: '20px', opacity: 0.7 }}>Powered by Electron</p>
    </div>
  )
}

export default App
