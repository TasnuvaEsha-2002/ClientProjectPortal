using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClientPortalAPI.Data;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectMembersController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectMembersController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/projectmembers?projectId=3
    // Returns the list of members (with names) for a specific project
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetMembers([FromQuery] int projectId)
    {
        var members = await _context.ProjectMembers
            .Where(pm => pm.ProjectId == projectId)
            .Select(pm => new
            {
                pm.Id,
                pm.UserId,
                UserName = pm.User!.FullName,
                UserRole = pm.User!.Role
            })
            .ToListAsync();

        return Ok(members);
    }

    // POST: api/projectmembers
    // Adds a user to a project. Only Admin/ProjectManager can do this.
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPost]
    public async Task<IActionResult> AddMember([FromBody] AddMemberDto dto)
    {
        // Prevent adding the same user twice
        bool alreadyMember = await _context.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == dto.ProjectId && pm.UserId == dto.UserId);

        if (alreadyMember)
        {
            return BadRequest("This user is already a member of the project.");
        }

        var member = new ProjectMember
        {
            ProjectId = dto.ProjectId,
            UserId = dto.UserId
        };

        _context.ProjectMembers.Add(member);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Member added to project." });
    }

    // DELETE: api/projectmembers/5
    // Removes a member from a project. Only Admin/ProjectManager can do this.
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveMember(int id)
    {
        var member = await _context.ProjectMembers.FindAsync(id);
        if (member == null)
        {
            return NotFound();
        }

        _context.ProjectMembers.Remove(member);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/projectmembers/my-projects
    // Returns the IDs of projects the currently logged-in user is a member of.
    // Used by the frontend to filter the Projects list for Team Members/Clients.
    [Authorize]
    [HttpGet("my-projects")]
    public async Task<ActionResult<IEnumerable<int>>> GetMyProjectIds()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var projectIds = await _context.ProjectMembers
            .Where(pm => pm.UserId == userId)
            .Select(pm => pm.ProjectId)
            .ToListAsync();

        return Ok(projectIds);
    }
}

// DTO for adding a member to a project
public class AddMemberDto
{
    public int ProjectId { get; set; }
    public int UserId { get; set; }
}