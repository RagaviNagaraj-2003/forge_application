import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@forge/bridge';

function App() {
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Start polling for task status
   */
  const startPolling = (newTaskId) => {
    setIsPolling(true);
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await invoke('check-task-status', { taskId: newTaskId });
        
        if (response.success) {
          setStatus(response.status);
          setProgress(response.progress);

          // If task is completed or failed, stop polling
          if (response.status === 'completed') {
            setResult(response.data.result);
            stopPolling();
          } else if (response.status === 'failed') {
            setError(response.data.error || 'Task failed');
            stopPolling();
          }
        } else {
          setError(response.message || 'Failed to check status');
          stopPolling();
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Error checking task status');
        stopPolling();
      }
    }, 3000); // Poll every 3 seconds
  };

  /**
   * Stop polling
   */
  const stopPolling = () => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  /**
   * Start the long-running task
   */
  const handleStartTask = async () => {
    try {
      setError(null);
      setResult(null);
      setProgress(0);
      setStatus('starting');

      // Invoke backend to start the task
      const response = await invoke('start-long-task');

      if (response.success) {
        const newTaskId = response.taskId;
        setTaskId(newTaskId);
        setStatus('queued');
        
        // Start polling for status
        startPolling(newTaskId);
      } else {
        setError('Failed to start task');
        setStatus('idle');
      }
    } catch (err) {
      console.error('Error starting task:', err);
      setError('Error starting task');
      setStatus('idle');
    }
  };

  /**
   * Reset the demo
   */
  const handleReset = () => {
    stopPolling();
    setTaskId(null);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  };

  /**
   * Get status color
   */
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return '#36B37E';
      case 'failed': return '#DE350B';
      case 'processing': return '#0065FF';
      case 'queued': return '#6554C0';
      default: return '#97A0AF';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Queue Demo - Long Running Task</h2>
        <p style={styles.description}>
          This demo starts a task that takes 200+ seconds to complete. 
          The frontend polls the backend every 3 seconds to check the status.
        </p>

        {/* Control Buttons */}
        <div style={styles.buttonContainer}>
          <button
            onClick={handleStartTask}
            disabled={status !== 'idle'}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(status !== 'idle' ? styles.disabledButton : {})
            }}
          >
            Start Long Task (220s)
          </button>

          {(status === 'completed' || status === 'failed') && (
            <button
              onClick={handleReset}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Reset Demo
            </button>
          )}
        </div>

        {/* Task Status */}
        {taskId && (
          <div style={styles.statusSection}>
            <div style={styles.statusHeader}>
              <div style={styles.statusBadge}>
                <div 
                  style={{ 
                    ...styles.statusIndicator, 
                    backgroundColor: getStatusColor() 
                  }} 
                />
                <span style={styles.statusText}>
                  {status.toUpperCase()}
                </span>
              </div>
              {isPolling && (
                <span style={styles.pollingIndicator}>
                  🔄 Polling...
                </span>
              )}
            </div>

            <div style={styles.taskInfo}>
              <strong>Task ID:</strong> {taskId}
            </div>

            {/* Progress Bar */}
            {(status === 'processing' || status === 'queued') && (
              <div style={styles.progressContainer}>
                <div style={styles.progressLabel}>
                  Progress: {progress}%
                </div>
                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${progress}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div style={styles.resultContainer}>
                <h3 style={styles.resultTitle}>✅ Task Completed!</h3>
                <div style={styles.resultBox}>
                  <pre style={styles.resultText}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div style={styles.errorContainer}>
                <h3 style={styles.errorTitle}>❌ Error</h3>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Information */}
        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>How it works:</h4>
          <ol style={styles.infoList}>
            <li>Click "Start Long Task" to queue a 220-second task</li>
            <li>The task is added to a Forge queue for processing</li>
            <li>Frontend polls backend every 3 seconds for status updates</li>
            <li>Progress updates are shown in real-time</li>
            <li>Final result is displayed when task completes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#F4F5F7',
    minHeight: '100vh'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    maxWidth: '800px',
    margin: '0 auto'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#172B4D'
  },
  description: {
    color: '#5E6C84',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  button: {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: '#0052CC',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#F4F5F7',
    color: '#172B4D'
  },
  disabledButton: {
    backgroundColor: '#F4F5F7',
    color: '#A5ADBA',
    cursor: 'not-allowed'
  },
  statusSection: {
    border: '1px solid #DFE1E6',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '20px'
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  statusText: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#172B4D'
  },
  pollingIndicator: {
    fontSize: '12px',
    color: '#5E6C84',
    animation: 'pulse 2s infinite'
  },
  taskInfo: {
    fontSize: '13px',
    color: '#5E6C84',
    marginBottom: '16px',
    fontFamily: 'monospace',
    backgroundColor: '#F4F5F7',
    padding: '8px',
    borderRadius: '4px'
  },
  progressContainer: {
    marginTop: '16px'
  },
  progressLabel: {
    fontSize: '13px',
    color: '#5E6C84',
    marginBottom: '8px',
    fontWeight: '500'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#F4F5F7',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0052CC',
    transition: 'width 0.3s ease',
    borderRadius: '4px'
  },
  resultContainer: {
    marginTop: '20px'
  },
  resultTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#36B37E',
    marginBottom: '12px'
  },
  resultBox: {
    backgroundColor: '#F4F5F7',
    borderRadius: '4px',
    padding: '16px',
    overflow: 'auto'
  },
  resultText: {
    margin: 0,
    fontSize: '13px',
    color: '#172B4D',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  errorContainer: {
    marginTop: '20px'
  },
  errorTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#DE350B',
    marginBottom: '8px'
  },
  errorText: {
    color: '#DE350B',
    fontSize: '14px'
  },
  infoBox: {
    backgroundColor: '#DEEBFF',
    borderRadius: '4px',
    padding: '16px',
    marginTop: '24px'
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0052CC',
    marginBottom: '8px',
    marginTop: 0
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#172B4D',
    lineHeight: '1.6'
  }
};

export default App;
