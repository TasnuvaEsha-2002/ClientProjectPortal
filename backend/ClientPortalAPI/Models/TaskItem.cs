namespace ClientPortalAPI.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "Not Started";
    public DateTime? DueDate { get; set; }
    public int CompletionPercentage { get; set; } = 0;

    // Link to the Project this task belongs to
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
}