namespace ClientPortalAPI.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "TeamMember";

    // NEW: tracks whether an Admin has approved this account yet.
    // Accounts start as false and cannot log in until approved.
    public bool IsApproved { get; set; } = false;
}