namespace ClientPortalAPI.Models;

public class ProjectDocument
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int? TaskId { get; set; }
    public TaskItem? Task { get; set; }

    public int? UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }

    // NEW: Optional link to a Milestone — lets a PM attach proof-of-work
    // (design file, deliverable, report) that the Client can review
    // before approving that milestone.
    public int? MilestoneId { get; set; }
    public Milestone? Milestone { get; set; }
}