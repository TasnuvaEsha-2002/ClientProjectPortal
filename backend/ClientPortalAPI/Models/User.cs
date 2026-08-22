namespace ClientPortalAPI.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "TeamMember";
    public bool IsApproved { get; set; } = false;

    // NEW: Admin can deactivate an account without permanently deleting it (soft delete)
    public bool IsActive { get; set; } = true;
}