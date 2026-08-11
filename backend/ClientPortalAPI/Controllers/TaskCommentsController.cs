using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ClientPortalAPI.Data;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TaskCommentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TaskCommentsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/taskcomments?taskId=5
    // Returns all comments for a specific task, including the commenter's name
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetComments([FromQuery] int taskId)
    {
        var comments = await _context.TaskComments
            .Where(c => c.TaskId == taskId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Text,
                c.CreatedAt,
                c.UserId,
                UserName = c.User!.FullName
            })
            .ToListAsync();

        return Ok(comments);
    }

    // POST: api/taskcomments
    // Any logged-in user can add a comment (Team Members need this to communicate on their tasks)
    [Authorize]
    [HttpPost]
    public async Task<ActionResult> CreateComment([FromBody] CreateCommentDto dto)
    {
        // Get the logged-in user's ID from their JWT token claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var comment = new TaskComment
        {
            Text = dto.Text,
            TaskId = dto.TaskId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Comment added." });
    }
}

// Simple DTO for creating a comment — just the task and the text
public class CreateCommentDto
{
    public int TaskId { get; set; }
    public string Text { get; set; } = string.Empty;
}