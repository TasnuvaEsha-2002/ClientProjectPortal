namespace ClientPortalAPI.Models;

// This is what the Project Manager sends us:
// the new/changed requirement they want analyzed
public class RequirementChangeDto
{
    public int ProjectId { get; set; }
    public string RequirementText { get; set; } = string.Empty;
}

// This is what we send back: the calculated impact of that requirement
public class ImpactAnalysisDto
{
    public string RequirementText { get; set; } = string.Empty;
    public List<string> AffectedAreas { get; set; } = new();
    public int EstimatedNewTasks { get; set; }
    public int EstimatedDelayDays { get; set; }
    public string RiskLevel { get; set; } = string.Empty; // Low, Medium, High
    public string Recommendation { get; set; } = string.Empty;
}