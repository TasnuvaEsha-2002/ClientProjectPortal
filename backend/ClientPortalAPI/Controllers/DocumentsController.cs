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

        return await query.OrderByDescending(d => d.UploadedAt).ToListAsync();
    }

    // POST: api/documents/upload
    // Accepts a file upload (multipart/form-data) along with a projectId,
    // an optional taskId (for task-specific deliverables), and tracks who uploaded it.
    // Any logged-in user can upload — Team Members need this to submit deliverables.
    [Authorize]
    [HttpPost("upload")]
    public async Task<ActionResult<ProjectDocument>> UploadDocument(
        [FromForm] IFormFile file,
        [FromForm] int projectId,
        [FromForm] int? taskId)
    {
        // Basic validation
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file was uploaded.");
        }

        var project = await _context.Projects.FindAsync(projectId);
        if (project == null)
        {
            return NotFound("Project not found.");
        }

        // Get the logged-in user's ID from their JWT token claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int? uploadedByUserId = int.TryParse(userIdClaim, out int uid) ? uid : null;

        // Create an "uploads" folder inside the app if it doesn't already exist
        var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Generate a unique file name so uploads never overwrite each other,
        // while still keeping the original name for display purposes
        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        // Save the actual file to disk
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Save the file's info (not the file itself) to the database
        var document = new ProjectDocument
        {
            FileName = file.FileName,
            FilePath = uniqueFileName,
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToLower(),
            UploadedAt = DateTime.UtcNow,
            ProjectId = projectId,
            TaskId = taskId,
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
        return File(fileBytes, "application/octet-stream", document.FileName);
    }

    // DELETE: api/documents/5
    [Authorize(Roles = "Admin,ProjectManager")]
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