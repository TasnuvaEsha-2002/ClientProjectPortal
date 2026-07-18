namespace ClientPortalAPI.Models;

// This class defines the shape of data we send back
// when a Project Manager requests a risk analysis for a project
public class RiskAnalysisDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int RiskScore { get; set; }        // 0 to 100
    public string RiskLevel { get; set; } = string.Empty; // Low, Medium, High
    public List<string> Reasons { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}