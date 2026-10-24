// Milestone Management page.
// - Admin/ProjectManager: can create milestones, optionally attaching
//   a document (deliverable/proof-of-work) that the Client can review.
//   A milestone is automatically created as "Completed" — since a
//   milestone represents work that's already done — and can be deleted.
// - Client: sees all milestones (read-only), and can approve Completed ones
//   after reviewing full details AND the attached document(s) in a dialog
// - Team Member: view-only
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
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const API_URL = 'http://localhost:5256/api/Milestones';
const PROJECTS_API_URL = 'http://localhost:5256/api/Projects';
const MEMBERS_API_URL = 'http://localhost:5256/api/ProjectMembers';
const DOCUMENTS_API_URL = 'http://localhost:5256/api/Documents';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

function MilestonesPage({ currentUser }) {
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [myProjectIds, setMyProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [milestoneDocuments, setMilestoneDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Success toast — used for both create AND delete confirmations
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // NEW: proper MUI confirmation dialog for deleting a milestone,
  // replacing the plain browser window.confirm() popup
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);

  const canManageMilestones = currentUser?.role === 'Admin' || currentUser?.role === 'ProjectManager';
  const isClient = currentUser?.role === 'Client';

  const fetchMilestones = () => {
    axios.get(API_URL)
      .then((response) => {
        setMilestones(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMilestones();
    axios.get(PROJECTS_API_URL)
      .then((response) => setProjects(response.data))
      .catch((err) => setError(err.message));

    if (!canManageMilestones) {
      axios.get(`${MEMBERS_API_URL}/my-projects`)
        .then((response) => setMyProjectIds(response.data))
        .catch(() => {});
    }
  }, [canManageMilestones]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (completionDate < getTodayDate()) {
      setError('Completion date cannot be in the past.');
      return;
    }

    const newMilestone = {
      id: 0,
      title,
      dueDate: completionDate ? `${completionDate}T00:00:00` : null,
      status: 'Completed',
      clientApproved: false,
      projectId: Number(projectId),
    };

    axios.post(API_URL, newMilestone)
      .then((response) => {
        const createdMilestoneId = response.data.id;

        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('projectId', projectId);
          formData.append('milestoneId', createdMilestoneId);

          return axios.post(`${DOCUMENTS_API_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      })
      .then(() => {
        fetchMilestones();

        setSuccessMessage(`Milestone "${title}" was created successfully.`);
        setSuccessOpen(true);

        setTitle('');
        setCompletionDate('');
        setProjectId('');
        setSelectedFile(null);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const handleOpenApprovalReview = (milestone) => {
    setSelectedMilestone(milestone);
    setApproveDialogOpen(true);
    setLoadingDocs(true);
    setMilestoneDocuments([]);

    axios.get(`${API_URL}/${milestone.id}/documents`)
      .then((response) => {
        setMilestoneDocuments(response.data);
        setLoadingDocs(false);
      })
      .catch(() => setLoadingDocs(false));
  };

  const handleConfirmApprove = () => {
    if (!selectedMilestone) return;
    axios.patch(`${API_URL}/${selectedMilestone.id}/approve`)
      .then(() => {
        fetchMilestones();
        setApproveDialogOpen(false);
        setSelectedMilestone(null);
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("You don't have permission to approve milestones.");
        } else {
          setError(err.message);
        }
      });
  };

  // Opens the confirmation dialog instead of deleting immediately
  const handleDeleteClick = (milestone) => {
    setMilestoneToDelete(milestone);
    setDeleteDialogOpen(true);
  };

  // Runs only after the user confirms inside the dialog
  const handleConfirmDelete = () => {
    if (!milestoneToDelete) return;

    axios.delete(`${API_URL}/${milestoneToDelete.id}`)
      .then(() => {
        fetchMilestones();
        setDeleteDialogOpen(false);

        setSuccessMessage(`Milestone "${milestoneToDelete.title}" was deleted successfully.`);
        setSuccessOpen(true);
        setMilestoneToDelete(null);
      })
      .catch((err) => {
        setDeleteDialogOpen(false);
        setMilestoneToDelete(null);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("You don't have permission to delete milestones.");
        } else {
          setError(err.message);
        }
      });
  };

  const handleDownloadDocument = (docId) => {
    window.open(`${DOCUMENTS_API_URL}/${docId}/download`, '_blank');
  };

  const statusColor = (status) => {
    if (status === 'Completed') return 'success';
    if (status === 'In Progress') return 'warning';
    return 'default';
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading milestones...</Typography>;

  const visibleMilestones = canManageMilestones
    ? milestones
    : milestones.filter((m) => myProjectIds.includes(m.projectId));

  return (
    <>
      {canManageMilestones && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Create New Milestone
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Milestone Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
              <TextField select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} required fullWidth>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Completion Date"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                required
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: getTodayDate() },
                }}
                fullWidth
              />

              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                {selectedFile ? selectedFile.name : 'Attach Deliverable Document (optional)'}
                <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
              </Button>

              <Button type="submit" variant="contained" size="large">
                Create Milestone
              </Button>
            </Stack>
          </Box>
        </>
      )}

      {!canManageMilestones && error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Milestones
      </Typography>

      {visibleMilestones.length === 0 ? (
        <Typography color="text.secondary">No milestones found.</Typography>
      ) : (
        <Stack spacing={2}>
          {visibleMilestones.map((milestone) => {
            const canApproveThis = isClient && milestone.status === 'Completed' && !milestone.clientApproved;

            return (
              <Card key={milestone.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {milestone.title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={milestone.status} color={statusColor(milestone.status)} size="small" />
                      {milestone.clientApproved && (
                        <Chip label="Client Approved" color="info" size="small" />
                      )}
                      {canApproveThis && (
                        <Button size="small" variant="contained" color="success" onClick={() => handleOpenApprovalReview(milestone)}>
                          Review & Approve
                        </Button>
                      )}
                      {canManageMilestones && (
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(milestone)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Completion Date: {new Date(milestone.dueDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Project: {projects.find((p) => p.id === milestone.projectId)?.name || `#${milestone.projectId}`}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* ---------- MILESTONE REVIEW & APPROVAL DIALOG (with documents) ---------- */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Milestone Before Approving</DialogTitle>
        <DialogContent>
          {selectedMilestone && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Milestone</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedMilestone.title}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Project</Typography>
                <Typography variant="body1">
                  {projects.find((p) => p.id === selectedMilestone.projectId)?.name || `#${selectedMilestone.projectId}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Completion Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedMilestone.dueDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Current Status</Typography>
                <Box>
                  <Chip label={selectedMilestone.status} color={statusColor(selectedMilestone.status)} size="small" />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Attached Deliverable File</Typography>
                {loadingDocs ? (
                  <Typography variant="body2" color="text.secondary">Loading documents...</Typography>
                ) : milestoneDocuments.length === 0 ? (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    No document was attached to this milestone. Please contact the Project Manager
                    before approving if you need to see the delivered work.
                  </Typography>
                ) : (
                  <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1, mt: 0.5 }}>
                    {milestoneDocuments.map((doc) => (
                      <ListItem
                        key={doc.id}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => handleDownloadDocument(doc.id)}>
                            <DownloadIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <InsertDriveFileIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.fileName}
                          secondary={`${doc.fileType.toUpperCase()} • ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This milestone has been marked as Completed by the Project Manager.
                Please review the attached document(s) above before approving.
                Approving confirms you have reviewed the delivered work and accept it
                as finished. This action cannot be undone.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConfirmApprove}>
            Confirm Approval
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW: proper delete confirmation dialog, replacing window.confirm() */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Milestone?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{milestoneToDelete?.title}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success toast — used for both create and delete confirmations */}
      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default MilestonesPage;