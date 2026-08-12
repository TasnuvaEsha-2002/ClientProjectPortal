namespace ClientPortalAPI.Models;

// Represents a file uploaded and linked to a specific project.
// The actual file is stored on disk; this model just tracks its info.
public class ProjectDocument
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Link to the Project this document belongs to
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    // NEW: Optional link to a specific Task (e.g. a deliverable for that task)
    public int? TaskId { get; set; }
    public TaskItem? Task { get; set; }

    // NEW: Who uploaded this document
    public int? UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }
}