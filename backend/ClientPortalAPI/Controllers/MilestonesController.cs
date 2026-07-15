using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClientPortalAPI.Data;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MilestonesController : ControllerBase
{
    private readonly AppDbContext _context;

    public MilestonesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/milestones
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Milestone>>> GetMilestones()
    {
        return await _context.Milestones.ToListAsync();
    }

    // GET: api/milestones/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Milestone>> GetMilestone(int id)
    {
        var milestone = await _context.Milestones.FindAsync(id);

        if (milestone == null)
        {
            return NotFound();
        }

        return milestone;
    }

    // POST: api/milestones
    [HttpPost]
    public async Task<ActionResult<Milestone>> CreateMilestone(Milestone milestone)
    {
        _context.Milestones.Add(milestone);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMilestone), new { id = milestone.Id }, milestone);
    }

    // PUT: api/milestones/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMilestone(int id, Milestone milestone)
    {
        if (id != milestone.Id)
        {
            return BadRequest();
        }

        _context.Entry(milestone).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/milestones/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMilestone(int id)
    {
        var milestone = await _context.Milestones.FindAsync(id);
        if (milestone == null)
        {
            return NotFound();
        }

        _context.Milestones.Remove(milestone);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}