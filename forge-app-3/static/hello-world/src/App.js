import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: ''
  });
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await invoke('createRecord', formData);
      
      if (result.success) {
        setMessage('Record saved successfully!');
        setFormData({ name: '', email: '', description: '' });
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (error) {
      setMessage('Error saving record: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleGetRecords = async () => {
    setLoading(true);
    setMessage('');

    try {
      const result = await invoke('getRecords');
      
      if (result.success) {
        setRecords(result.data);
        setMessage(`Retrieved ${result.data.length} record(s)`);
      } else {
        setMessage('Error: ' + result.message);
        setRecords([]);
      }
    } catch (error) {
      setMessage('Error retrieving records: ' + error.message);
      setRecords([]);
    }
    
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    
    try {
      const result = await invoke('deleteRecord', { id });
      
      if (result.success) {
        setMessage('Record deleted successfully!');
        // Refresh the records list
        handleGetRecords();
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (error) {
      setMessage('Error deleting record: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Forge CRUD Application</h1>
        
        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="form-section">
          <h2>Create New Record</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                disabled={loading}
                rows="4"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </form>
        </div>

        <div className="records-section">
          <h2>Saved Records</h2>
          <button 
            onClick={handleGetRecords} 
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Retrieve Records'}
          </button>

          {records.length > 0 && (
            <div className="records-list">
              {records.map((record) => (
                <div key={record.id} className="record-card">
                  <div className="record-header">
                    <h3>{record.name}</h3>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="btn btn-delete"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                  <p><strong>Email:</strong> {record.email}</p>
                  <p><strong>Description:</strong> {record.description}</p>
                  <p className="record-date">
                    <small>Created: {new Date(record.createdAt).toLocaleString()}</small>
                  </p>
                </div>
              ))}
            </div>
          )}

          {records.length === 0 && message.includes('Retrieved') && (
            <p className="no-records">No records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
