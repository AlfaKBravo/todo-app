import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Check, X } from 'lucide-react';

const Dashboard = () => {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get('/api/todos');
      setTodos(res.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await axios.post('/api/todos', { title });
      setTodos([res.data, ...todos]);
      setTitle('');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.limitReached) {
        if (window.confirm(err.response.data.message + " Would you like to upgrade now?")) {
          handlePayment();
        }
      } else {
        console.error('Error adding todo:', err);
      }
    }
  };

  const handlePayment = async () => {
    try {
      const orderRes = await axios.post('/api/payment/order');
      const { id: order_id, amount, currency } = orderRes.data;

      const options = {
        key: 'rzp_test_your_key_id', // Should match .env RAZORPAY_KEY_ID
        amount: amount,
        currency: currency,
        name: 'TodoApp Pro',
        description: 'Unlock unlimited tasks',
        order_id: order_id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/api/payment/verify', response);
            alert(verifyRes.data.message);
            window.location.reload(); // Refresh to update user state
          } catch (error) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment Error:', err);
      alert('Failed to initiate payment');
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const toggleTodo = async (id, completed) => {
    try {
      const res = await axios.put(`/api/todos/${id}`, { completed: !completed });
      setTodos(todos.map(todo => todo.id === id ? res.data : todo));
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`/api/todos/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Welcome, {user?.email}</h2>
      
      <form onSubmit={addTodo} className="add-todo-form">
        <input 
          type="text" 
          className="form-control" 
          placeholder="What needs to be done?" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Add Task</button>
      </form>

      {todos.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>No tasks yet. Add one above!</p>
      ) : (
        <ul className="todo-list">
          {todos.map(todo => (
            <li key={todo.id} className="todo-item">
              <button 
                onClick={() => toggleTodo(todo.id, todo.completed)} 
                className="btn btn-outline" 
                style={{ 
                  padding: '0.25rem', 
                  borderRadius: '50%', 
                  width: '24px', 
                  height: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: todo.completed ? 'var(--success-color)' : 'transparent',
                  borderColor: todo.completed ? 'var(--success-color)' : 'var(--border-color)',
                  color: todo.completed ? 'white' : 'transparent'
                }}
              >
                <Check size={14} />
              </button>
              
              <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                {todo.title}
              </span>
              
              <div className="todo-actions">
                <button onClick={() => deleteTodo(todo.id)} className="btn" style={{ padding: '0.5rem', color: 'var(--danger-color)', background: 'transparent' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
