import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import { Queue } from '@forge/events'

const resolver = new Resolver();
const queue = new Queue({ key: 'long-task-queue' });

/**
 * Dummy function that deliberately takes 200+ seconds to complete
 * This simulates a long-running process
 */
//test
async function dummyLongRunningFunction(taskId) {
  console.log(`Starting long task: ${taskId}`);
  
  // Simulate a 220-second delay (200+ seconds as required)
  const delaySeconds = 220;
  const startTime = Date.now();
  
  // Update progress periodically
  for (let i = 0; i <= 100; i += 10) {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= delaySeconds * (i / 100)) {
      await storage.set(`task-${taskId}-progress`, i);
      console.log(`Task ${taskId} progress: ${i}%`);
      
      // Wait for the next checkpoint
      const targetTime = startTime + (delaySeconds * 1000 * ((i + 10) / 100));
      const waitTime = targetTime - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // Generate dummy response after the delay
  const response = {
    taskId: taskId,
    status: 'completed',
    timestamp: new Date().toISOString(),
    duration: `${delaySeconds} seconds`,
    data: {
      message: 'Long-running task completed successfully!',
      result: `Processed task ${taskId}`,
      metadata: {
        itemsProcessed: 1000,
        successRate: '100%',
        details: 'All operations completed without errors'
      }
    }
  };
  
  console.log(`Task ${taskId} completed after ${delaySeconds} seconds`);
  return response;
}

/**
 * Start a long-running task by adding it to the queue
 */
resolver.define('start-long-task', async (req) => {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store initial task status
  await storage.set(`task-${taskId}`, {
    status: 'queued',
    createdAt: new Date().toISOString(),
    progress: 0
  });
  
  // Add task to queue for processing
  await queue.push({ body : { taskId: taskId } });
  
  console.log(`Task ${taskId} added to queue`);
  
  return {
    success: true,
    taskId: taskId,
    message: 'Task queued for processing'
  };
});

/**
 * Queue consumer - processes tasks from the queue
 */
export async function processLongTask(event) {
  const { taskId } = event.body;
  
  console.log(`Processing task from queue: ${taskId}`);
  
  try {
    // Update status to processing
    await storage.set(`task-${taskId}`, {
      status: 'processing',
      startedAt: new Date().toISOString(),
      progress: 0
    });
    
    // Execute the long-running function
    const result = await dummyLongRunningFunction(taskId);
    
    // Store the completed result
    await storage.set(`task-${taskId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      result: result,
      progress: 100
    });
    
    console.log(`Task ${taskId} processing completed`);
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    
    // Store error status
    await storage.set(`task-${taskId}`, {
      status: 'failed',
      error: error.message,
      failedAt: new Date().toISOString()
    });
  }
}

/**
 * Check the status of a task
 */
resolver.define('check-task-status', async (req) => {
  const { taskId } = req.payload;
  
  // Retrieve task status from storage
  const taskData = await storage.get(`task-${taskId}`);
  
  if (!taskData) {
    return {
      success: false,
      message: 'Task not found'
    };
  }
  
  // Get progress if available over there
  const progress = await storage.get(`task-${taskId}-progress`) || taskData.progress || 0;
  
  return {
    success: true,
    taskId: taskId,
    status: taskData.status,
    progress: progress,
    data: taskData
  };
});

/**
 * Main resolver handler
 */
resolver.define('resolver', (req) => {
  return {
    message: 'Queue Demo Panel Loaded'
  };
});

export const handler = resolver.getDefinitions();
