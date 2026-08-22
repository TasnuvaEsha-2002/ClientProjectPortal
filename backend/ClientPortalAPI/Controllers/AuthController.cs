using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ClientPortalAPI.Data;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            return BadRequest("A user with this email already exists.");
        }

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User registered successfully. Your account is pending admin approval." });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        // Block login until an Admin has approved this account
        if (!user.IsApproved)
        {
            return Unauthorized("Your account is pending approval from an administrator.");
        }

        // NEW: Block login if an Admin has deactivated this account
        if (!user.IsActive)
        {
            return Unauthorized("Your account has been deactivated. Please contact an administrator.");
        }

        var token = GenerateJwtToken(user);

        return Ok(new
        {
            token,
            user = new { user.Id, user.FullName, user.Email, user.Role }
        });
    }

    // GET: api/auth/pending-users
    // Returns all users who are registered but not yet approved.
    // Only Admins can see this list.
    [Authorize(Roles = "Admin")]
    [HttpGet("pending-users")]
    public async Task<ActionResult<IEnumerable<object>>> GetPendingUsers()
    {
        var pendingUsers = await _context.Users
            .Where(u => !u.IsApproved)
            .Select(u => new { u.Id, u.FullName, u.Email, u.Role })
            .ToListAsync();

        return Ok(pendingUsers);
    }

    // GET: api/auth/users-brief
    // Returns basic info (id, fullName, role) for all approved users.
    // Accessible to ANY logged-in user — used to display names instead of raw IDs
    // wherever a task/project shows an assigned user.
    [Authorize]
    [HttpGet("users-brief")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsersBrief()
    {
        var users = await _context.Users
            .Where(u => u.IsApproved)
            .Select(u => new { u.Id, u.FullName, u.Role })
            .ToListAsync();

        return Ok(users);
    }

    // GET: api/auth/team-members
    // Returns all approved users with the TeamMember role,
    // used to populate assignment dropdowns when creating/editing tasks.
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpGet("team-members")]
    public async Task<ActionResult<IEnumerable<object>>> GetTeamMembers()
    {
        var teamMembers = await _context.Users
            .Where(u => u.Role == "TeamMember" && u.IsApproved)
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToListAsync();

        return Ok(teamMembers);
    }

    // PUT: api/auth/approve/5
    // Approves a specific user, allowing them to log in.
    // Optionally lets the Admin correct the user's role at the same time.
    [Authorize(Roles = "Admin")]
    [HttpPut("approve/{id}")]
    public async Task<IActionResult> ApproveUser(int id, [FromBody] string? correctedRole)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        user.IsApproved = true;

        // If a corrected role was provided, apply it
        // (kept optional in case this endpoint is reused later)
        if (!string.IsNullOrEmpty(correctedRole))
        {
            user.Role = correctedRole;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "User approved successfully.", user.Id, user.FullName, user.Role });
    }

    // DELETE: api/auth/reject/5
    // Rejects a pending user by removing their registration entirely.
    // Only Admins can do this.
    [Authorize(Roles = "Admin")]
    [HttpDelete("reject/{id}")]
    public async Task<IActionResult> RejectUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        // Only allow rejecting users who haven't been approved yet,
        // to avoid accidentally deleting an active account
        if (user.IsApproved)
        {
            return BadRequest("Cannot reject a user who is already approved.");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User registration rejected and removed." });
    }

    // GET: api/auth/all-users
    // Returns every user in the system (approved and pending), for Admin's User Management page
    [Authorize(Roles = "Admin")]
    [HttpGet("all-users")]
    public async Task<ActionResult<IEnumerable<object>>> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Role,
                u.IsApproved,
                u.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }

    // PUT: api/auth/change-role/5
    // Lets an Admin change a user's system role
    [Authorize(Roles = "Admin")]
    [HttpPut("change-role/{id}")]
    public async Task<IActionResult> ChangeUserRole(int id, [FromBody] string newRole)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        user.Role = newRole;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Role updated successfully.", user.FullName, user.Role });
    }

    // PUT: api/auth/toggle-active/5
    // Lets an Admin activate or deactivate a user's account (soft delete)
    [Authorize(Roles = "Admin")]
    [HttpPut("toggle-active/{id}")]
    public async Task<IActionResult> ToggleUserActive(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        // Prevent an Admin from accidentally deactivating their own account while logged in
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (callerIdClaim != null && int.TryParse(callerIdClaim, out int callerId) && callerId == id)
        {
            return BadRequest("You cannot deactivate your own account.");
        }

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { message = user.IsActive ? "User activated." : "User deactivated.", user.IsActive });
    }

    // GET: api/auth/me
    // Returns the logged-in user's own profile info
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new { user.Id, user.FullName, user.Email, user.Role });
    }

    // PUT: api/auth/me
    // Lets the logged-in user update their own name and/or password.
    // Email and Role cannot be changed here — only an Admin can change roles.
    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(dto.FullName))
        {
            user.FullName = dto.FullName;
        }

        // Only update the password if a new one was actually provided
        if (!string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully.", user.FullName });
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}