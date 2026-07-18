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
    // GET: api/projects/5/risk-analysis
    // This is our AI-assisted Deadline Risk Prediction feature.
    // It analyzes a project's tasks and milestones to calculate a risk score.
    [HttpGet("{id}/risk-analysis")]
    public async Task<ActionResult<RiskAnalysisDto>> GetRiskAnalysis(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
        {
            return NotFound();
        }

        // Get all tasks and milestones linked to this project
        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == id)
            .ToListAsync();

        var milestones = await _context.Milestones
            .Where(m => m.ProjectId == id)
            .ToListAsync();

        int riskScore = 0;
        var reasons = new List<string>();
        var recommendations = new List<string>();

        // Rule 1: Check overdue tasks (due date passed but not completed)
        var overdueTasks = tasks.Count(t =>
            t.DueDate.HasValue &&
            t.DueDate.Value < DateTime.Now &&
            t.Status != "Completed");

        if (overdueTasks > 0)
        {
            riskScore += overdueTasks * 15; // each overdue task adds risk
            reasons.Add($"{overdueTasks} task(s) are overdue.");
            recommendations.Add("Review and reassign overdue tasks immediately.");
        }

        // Rule 2: Check task completion ratio
        if (tasks.Count > 0)
        {
            int completedTasks = tasks.Count(t => t.Status == "Completed");
            double completionRatio = (double)completedTasks / tasks.Count;

            if (completionRatio < 0.5)
            {
                riskScore += 20;
                reasons.Add("Less than 50% of tasks are completed.");
                recommendations.Add("Increase team focus on pending tasks.");
            }
        }
        else
        {
            // No tasks created yet is itself a warning sign
            riskScore += 10;
            reasons.Add("No tasks have been created for this project yet.");
            recommendations.Add("Break down the project into tasks to track progress.");
        }

        // Rule 3: Check milestones pending client approval
        var pendingApprovals = milestones.Count(m => !m.ClientApproved && m.Status == "Completed");
        if (pendingApprovals > 0)
        {
            riskScore += pendingApprovals * 10;
            reasons.Add($"{pendingApprovals} completed milestone(s) awaiting client approval.");
            recommendations.Add("Follow up with the client for pending approvals.");
        }

        // Rule 4: Check days remaining until deadline
        var daysRemaining = (project.Deadline - DateTime.Now).TotalDays;
        if (daysRemaining < 0)
        {
            riskScore += 30;
            reasons.Add("The project deadline has already passed.");
            recommendations.Add("Reassess the timeline and communicate delays to stakeholders.");
        }
        else if (daysRemaining < 7)
        {
            riskScore += 15;
            reasons.Add("Less than 7 days remain until the deadline.");
            recommendations.Add("Prioritize critical remaining tasks.");
        }

        // Cap the score at 100
        if (riskScore > 100) riskScore = 100;

        // Determine risk level based on score
        string riskLevel = riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low";

        // If everything looks fine, give a positive message
        if (reasons.Count == 0)
        {
            reasons.Add("No major risk factors detected.");
            recommendations.Add("Continue current progress and monitor regularly.");
        }

        var result = new RiskAnalysisDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            RiskScore = riskScore,
            RiskLevel = riskLevel,
            Reasons = reasons,
            Recommendations = recommendations
        };

        return Ok(result);
    }
}