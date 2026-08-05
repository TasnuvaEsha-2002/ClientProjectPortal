namespace ClientPortalAPI.Models;

// Represents a file uploaded and linked to a specific project.
// The actual file is stored on disk; this model just tracks its info.
public class ProjectDocument
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;   // original file name shown to users
    public string FilePath { get; set; } = string.Empty;   // where the file is saved on the server
    public string FileType { get; set; } = string.Empty;   // e.g. "pdf", "docx", "png"
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Link to the Project this document belongs to
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
}