import Resolver from '@forge/resolver';
import api, { storage } from '@forge/api';

const resolver = new Resolver();

// Create a new record
resolver.define('createRecord', async (req) => {
  const { name, email, description } = req.payload;
  
  try {
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Store in Forge Storage (simulating SQL behavior)
    const record = {
      id,
      name,
      email,
      description,
      createdAt: new Date().toISOString()
    };
    
    await storage.set(id, record);
    
    // Also maintain a list of all IDs
    let allIds = await storage.get('all_record_ids') || [];
    allIds.push(id);
    await storage.set('all_record_ids', allIds);
    
    return {
      success: true,
      message: 'Record created successfully',
      data: record
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

// Get all records
resolver.define('getRecords', async (req) => {
  try {
    const allIds = await storage.get('all_record_ids') || [];
    
    const records = [];
    for (const id of allIds) {
      const record = await storage.get(id);
      if (record) {
        records.push(record);
      }
    }
    
    return {
      success: true,
      data: records
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
});

// Delete a record
resolver.define('deleteRecord', async (req) => {
  const { id } = req.payload;
  
  try {
    await storage.delete(id);
    
    // Remove from ID list
    let allIds = await storage.get('all_record_ids') || [];
    allIds = allIds.filter(recordId => recordId !== id);
    await storage.set('all_record_ids', allIds);
    
    return {
      success: true,
      message: 'Record deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

export const handler = resolver.getDefinitions();