using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClientPortalAPI.Data;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/tasks
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
    {
        return await _context.Tasks.ToListAsync();
    }

    // GET: api/tasks/5
    [HttpGet("{id}")]
    public async Task<ActionResult<TaskItem>> GetTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
        {
            return NotFound();
        }

        return task;
    }

    // POST: api/tasks
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPost]
    public async Task<ActionResult<TaskItem>> CreateTask(TaskItem task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // If this task is assigned to someone, automatically make them
        // a member of the project too — so they can see the project
        // and this task shows up correctly on their filtered pages.
        if (task.AssignedUserId.HasValue)
        {
            bool alreadyMember = await _context.ProjectMembers.AnyAsync(
                pm => pm.ProjectId == task.ProjectId && pm.UserId == task.AssignedUserId.Value);

            if (!alreadyMember)
            {
                _context.ProjectMembers.Add(new ProjectMember
                {
                    ProjectId = task.ProjectId,
                    UserId = task.AssignedUserId.Value
                });
                await _context.SaveChangesAsync();
            }
        }

        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    // PUT: api/tasks/5
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, TaskItem task)
    {
        if (id != task.Id)
        {
            return BadRequest();
        }

        _context.Entry(task).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/tasks/5/status
    // Lightweight endpoint for Team Members: allows updating ONLY the status
    // of a task, without needing permission to edit everything else about it.
    [Authorize] // any logged-in user can call this
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] string status)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
        {
            return NotFound();
        }

        task.Status = status;

        // If marked Completed, also bump completion percentage to 100 automatically
        if (status == "Completed")
        {
            task.CompletionPercentage = 100;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/tasks/5
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
        {
            return NotFound();
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }
    // PATCH: api/tasks/5/progress
    // Lightweight endpoint for Team Members: allows updating ONLY the
    // completion percentage of a task.
    [Authorize]
    [HttpPatch("{id}/progress")]
    public async Task<IActionResult> UpdateTaskProgress(int id, [FromBody] int percentage)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
        {
            return NotFound();
        }

        // Keep the value within a sensible 0-100 range
        task.CompletionPercentage = Math.Clamp(percentage, 0, 100);

        // If progress hits 100%, automatically mark the task Completed too
        if (task.CompletionPercentage == 100)
        {
            task.Status = "Completed";
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
    // PATCH: api/tasks/5/blocker
    // Lets any logged-in user (typically the assigned Team Member) report
    // that they're blocked on a task, along with the reason. Passing an
    // empty reason clears the blocker (marks it resolved).
    [Authorize]
    [HttpPatch("{id}/blocker")]
    public async Task<IActionResult> ReportBlocker(int id, [FromBody] string? reason)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            // Empty reason means the blocker is resolved/cleared
            task.IsBlocked = false;
            task.BlockerReason = null;
        }
        else
        {
            task.IsBlocked = true;
            task.BlockerReason = reason;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
}