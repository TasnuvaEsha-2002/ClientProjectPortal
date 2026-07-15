namespace ClientPortalAPI.Models;

public class Milestone
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public bool ClientApproved { get; set; } = false;
    public string Status { get; set; } = "Pending";

    // Link to the Project this milestone belongs to
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
}