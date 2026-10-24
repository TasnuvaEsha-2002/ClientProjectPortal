using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClientPortalAPI.Data;
using ClientPortalAPI.Models;
using System.Security.Claims;

namespace ClientPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DocumentsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // GET: api/documents?projectId=3
    // Returns all documents, optionally filtered by project
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDocument>>> GetDocuments([FromQuery] int? projectId)
    {
        var query = _context.Documents.AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(d => d.ProjectId == projectId.Value);
        }

        return await query
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
    }

    // GET: api/documents/milestone/5
    // Returns all documents linked to a specific milestone.
    // Used by the Client's milestone-approval dialog, so the client can
    // review supporting evidence before approving.
    [Authorize]
    [HttpGet("milestone/{milestoneId}")]
    public async Task<ActionResult<IEnumerable<ProjectDocument>>> GetMilestoneDocuments(int milestoneId)
    {
        var milestone = await _context.Milestones.FindAsync(milestoneId);

        if (milestone == null)
        {
            return NotFound("Milestone not found.");
        }

        // Ownership check: Admin/PM can view any milestone's documents.
        // Team Member/Client must actually be a member of the milestone's project.
        if (!User.IsInRole("Admin") && !User.IsInRole("ProjectManager"))
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out int userId);

            bool isMember = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == milestone.ProjectId && pm.UserId == userId);

            if (!isMember)
            {
                return Forbid();
            }
        }

        var documents = await _context.Documents
            .Where(d => d.MilestoneId == milestoneId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

        return Ok(documents);
    }

    // POST: api/documents/upload
    // Accepts a file upload (multipart/form-data) along with a projectId,
    // an optional taskId (for task-specific deliverables), an optional
    // milestoneId (for milestone supporting evidence), and tracks who uploaded it.
    // Clients are not allowed to upload documents.
        [Authorize]
    [HttpPost("upload")]
    public async Task<ActionResult<ProjectDocument>> UploadDocument(
        [FromForm] IFormFile file,
        [FromForm] int projectId,
        [FromForm] int? taskId,
        [FromForm] int? milestoneId)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file was uploaded.");
        }

        if (User.IsInRole("Client"))
        {
            return Forbid();
        }

        var project = await _context.Projects.FindAsync(projectId);
        if (project == null)
        {
            return NotFound("Project not found.");
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int? uploadedByUserId = int.TryParse(userIdClaim, out int uid) ? uid : null;

        var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var document = new ProjectDocument
        {
            FileName = file.FileName,
            FilePath = uniqueFileName,
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToLower(),
            UploadedAt = DateTime.UtcNow,
            ProjectId = projectId,
            TaskId = taskId,
            MilestoneId = milestoneId,
            UploadedByUserId = uploadedByUserId
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        return Ok(document);
    }

    // GET: api/documents/5/download
    // Streams the actual file back to the browser for download
    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadDocument(int id)
    {
        var document = await _context.Documents.FindAsync(id);

        if (document == null)
        {
            return NotFound();
        }

        var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
        var filePath = Path.Combine(uploadsFolder, document.FilePath);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound("File not found on server.");
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

        return File(
            fileBytes,
            "application/octet-stream",
            document.FileName
        );
    }

    // DELETE: api/documents/5
    [Authorize(Roles = "ProjectManager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(int id)
    {
        var document = await _context.Documents.FindAsync(id);

        if (document == null)
        {
            return NotFound();
        }

        // Delete the actual file from disk too, not just the database record
        var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
        var filePath = Path.Combine(uploadsFolder, document.FilePath);

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }

        _context.Documents.Remove(document);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}