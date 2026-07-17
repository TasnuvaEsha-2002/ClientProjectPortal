using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClientPortalAPI.Data;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/projects
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
    {
        return await _context.Projects.ToListAsync();
    }

    // GET: api/projects/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(int id)
    {
        var project = await _context.Projects.FindAsync(id);

        if (project == null)
        {
            return NotFound();
        }

        return project;
    }

    // POST: api/projects
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject(Project project)
    {
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    // PUT: api/projects/5
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, Project project)
    {
        if (id != project.Id)
        {
            return BadRequest();
        }

        _context.Entry(project).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/projects/5
    [Authorize(Roles = "Admin,ProjectManager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
        {
            return NotFound();
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}