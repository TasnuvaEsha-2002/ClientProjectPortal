namespace ClientPortalAPI.Models;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime Deadline { get; set; }
    public string Status { get; set; } = "Pending";
}