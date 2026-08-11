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
}