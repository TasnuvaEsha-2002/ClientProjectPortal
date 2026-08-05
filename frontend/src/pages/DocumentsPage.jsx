// This page implements the Document Management module from the proposal —
// allowing Project Managers to upload files linked to a project,
// and everyone to view/download the list of uploaded documents.
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Stack,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const API_URL = 'http://localhost:5256/api/Documents';
const PROJECTS_API_URL = 'http://localhost:5256/api/Projects';

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [projectId, setProjectId] = useState('');

  const fetchDocuments = () => {
    axios.get(API_URL)
      .then((response) => {
        setDocuments(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
    axios.get(PROJECTS_API_URL)
      .then((response) => setProjects(response.data))
      .catch((err) => setError(err.message));
  }, []);

  // Handles the file upload form submission.
  // Unlike our other forms, this one needs FormData instead of plain JSON,
  // because we're sending an actual file.
  const handleUpload = (e) => {
    e.preventDefault();

    if (!selectedFile || !projectId) {
      setError('Please select a file and a project.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('projectId', projectId);

    axios.post(`${API_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(() => {
        fetchDocuments();
        setSelectedFile(null);
        setProjectId('');
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("You don't have permission to upload documents.");
        } else {
          setError(err.message);
        }
      });
  };

  // Triggers a file download by opening the download URL in a new tab
  const handleDownload = (id, fileName) => {
    window.open(`${API_URL}/${id}/download`, '_blank');
  };

  const handleDelete = (id) => {
    axios.delete(`${API_URL}/${id}`)
      .then(() => fetchDocuments())
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("You don't have permission to delete documents.");
        } else {
          setError(err.message);
        }
      });
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading documents...</Typography>;

  return (
    <>
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Upload Document
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box component="form" onSubmit={handleUpload}>
        <Stack spacing={2}>
          <TextField
            select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            fullWidth
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
          >
            {selectedFile ? selectedFile.name : 'Choose File'}
            <input
              type="file"
              hidden
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </Button>

          <Button type="submit" variant="contained" size="large">
            Upload
          </Button>
        </Stack>
      </Box>

      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Documents
      </Typography>

      {documents.length === 0 ? (
        <Typography color="text.secondary">No documents uploaded yet.</Typography>
      ) : (
        <Card variant="outlined">
          <List>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton edge="end" onClick={() => handleDownload(doc.id, doc.fileName)}>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton edge="end" color="error" onClick={() => handleDelete(doc.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText
                  primary={doc.fileName}
                  secondary={`${doc.fileType.toUpperCase()} • Uploaded ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </>
  );
}

export default DocumentsPage;