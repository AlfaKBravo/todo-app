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
      const res = await axios.get('http://localhost:5000/api/todos');
      setTodos(res.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/todos', { title });
      setTodos([res.data, ...todos]);
      setTitle('');
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/todos/${id}`, { completed: !completed });
      setTodos(todos.map(todo => todo.id === id ? res.data : todo));
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`);
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
