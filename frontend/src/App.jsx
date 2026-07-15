import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5256/api/Projects';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Pending');

  const fetchProjects = () => {
    axios.get(API_URL)
      .then((response) => {
        setProjects(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newProject = {
      id: 0,
      name,
      description,
      startDate: startDate ? `${startDate}T00:00:00` : null,
      deadline: deadline ? `${deadline}T00:00:00` : null,
      status,
    };

    axios.post(API_URL, newProject)
      .then(() => {
        fetchProjects();
        setName('');
        setDescription('');
        setStartDate('');
        setDeadline('');
        setStatus('Pending');
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Client Project Collaboration Portal</h1>

      <h2>Create New Project</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Deadline:
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <button type="submit">Create Project</button>
      </form>

      <h2>Projects</h2>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id} style={{ marginBottom: '1rem' }}>
              <strong>{project.name}</strong> — {project.status}
              <br />
              {project.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;