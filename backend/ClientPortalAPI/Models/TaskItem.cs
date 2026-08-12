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

    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }

    // NEW: Blocker tracking — lets a Team Member flag they're stuck
    public bool IsBlocked { get; set; } = false;
    public string? BlockerReason { get; set; }
}