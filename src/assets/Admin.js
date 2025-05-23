import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

const styles = `
  .admin-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 20px;
    font-family: 'Arial', sans-serif;
  }

  .admin-section {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 2rem;
  }

  h2 {
    color: #34495e;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 1rem;
  }

  input {
    flex: 1;
    padding: 10px;
    border: 1px solid #bdc3c7;
    border-radius: 5px;
    font-size: 16px;
  }

  button {
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover:not(:disabled) {
    background-color: #2980b9;
  }

  button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  .delete-btn {
    padding: 2px 8px;
    background-color: #e74c3c;
    margin-left: 10px;
  }

  .delete-btn:hover:not(:disabled) {
    background-color: #c0392b;
  }

  .items-list {
    margin-top: 1rem;
  }

  .items-list h3 {
    color: #7f8c8d;
    margin-bottom: 0.5rem;
    font-size: 0.9em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  li {
    background: white;
    padding: 8px 15px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .message {
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
    font-size: 0.9em;
  }

  .message.success {
    background-color: #d4edda;
    color: #155724;
  }

  .message.error {
    background-color: #f8d7da;
    color: #721c24;
  }
`;

const Admin = () => {
  const [inputs, setInputs] = useState({
    category: '',
    country: '',
    language: ''
  });

  const [existingItems, setExistingItems] = useState({
    categories: [],
    countries: [],
    languages: []
  });

  const [loading, setLoading] = useState({
    category: false,
    country: false,
    language: false
  });

  const [messages, setMessages] = useState({
    category: '',
    country: '',
    language: ''
  });

  // Add styles to document head
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Initialize or fetch document data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const docRef = doc(db, 'homeDropdown', 'homeDropdown');
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          await setDoc(docRef, {
            categories: [],
            countries: [],
            languages: []
          });
        }

        const data = docSnap.data() || {};
        setExistingItems({
          categories: data.categories || [],
          countries: data.countries || [],
          languages: data.languages || []
        });
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeData();
  }, []);

  const handleAction = async (field, action, value = null) => {
    setLoading(prev => ({ ...prev, [field]: true }));
    setMessages(prev => ({ ...prev, [field]: '' }));

    try {
      const docRef = doc(db, 'homeDropdown', 'homeDropdown');
      
      if (action === 'add') {
        const newValue = inputs[field].trim();
        
        if (!newValue) {
          setMessages(prev => ({ ...prev, [field]: 'Please enter a value' }));
          return;
        }
        
        if (existingItems[field].includes(newValue)) {
          setMessages(prev => ({ ...prev, [field]: 'Item already exists' }));
          return;
        }

        await updateDoc(docRef, {
          [field]: arrayUnion(newValue)
        });

        setExistingItems(prev => ({
          ...prev,
          [field]: [...prev[field], newValue]
        }));
        setInputs(prev => ({ ...prev, [field]: '' }));

      } else if (action === 'remove') {
        await updateDoc(docRef, {
          [field]: arrayRemove(value)
        });

        setExistingItems(prev => ({
          ...prev,
          [field]: prev[field].filter(item => item !== value)
        }));
      }

      setMessages(prev => ({
        ...prev,
        [field]: action === 'add' ? 'Item added successfully!' : 'Item removed successfully!'
      }));

    } catch (error) {
      console.error('Firestore error:', error);
      setMessages(prev => ({
        ...prev,
        [field]: `Error: ${error.message}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
      setTimeout(() => {
        setMessages(prev => ({ ...prev, [field]: '' }));
      }, 3000);
    }
  };

  const renderSection = (field) => {
    const items = existingItems[field];
    const message = messages[field];
    const isError = message?.startsWith('Error');

    return (
      <div className="admin-section" key={field}>
        <h2>{field.charAt(0).toUpperCase() + field.slice(1)}</h2>
        
        <div className="input-group">
          <input
            type="text"
            value={inputs[field]}
            onChange={(e) => setInputs(prev => ({
              ...prev,
              [field]: e.target.value
            }))}
            placeholder={`New ${field}`}
            disabled={loading[field]}
          />
          <button
            onClick={() => handleAction(field, 'add')}
            disabled={loading[field] || !inputs[field].trim()}
          >
            {loading[field] ? 'Saving...' : 'Add'}
          </button>
        </div>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {items.length > 0 && (
          <div className="items-list">
            <h3>Existing {field}s:</h3>
            <ul>
              {items.map((item, index) => (
                <li key={index}>
                  {item}
                  <button
                    className="delete-btn"
                    onClick={() => handleAction(field, 'remove', item)}
                    disabled={loading[field]}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-container">
      <h1>Dropdown Management</h1>
      {renderSection('categories')}
      {renderSection('countries')}
      {renderSection('languages')}
    </div>
  );
};

export default Admin;