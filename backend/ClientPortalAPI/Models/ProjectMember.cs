namespace ClientPortalAPI.Models;

// This is a "join table" model — it connects Projects and Users
// in a many-to-many relationship (one Project can have many members,
// one User can be a member of many Projects).
public class ProjectMember
{
    public int Id { get; set; }

    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }
}