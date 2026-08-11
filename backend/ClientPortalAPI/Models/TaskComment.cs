namespace ClientPortalAPI.Models;

// Represents a comment left on a task — used for communication
// between the assigned Team Member and the Project Manager.
public class TaskComment
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Who wrote this comment
    public int UserId { get; set; }
    public User? User { get; set; }

    // Which task this comment belongs to
    public int TaskId { get; set; }
    public TaskItem? Task { get; set; }
}