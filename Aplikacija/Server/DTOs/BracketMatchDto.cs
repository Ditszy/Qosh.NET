namespace Server.Dtos;

public class BracketMatchDto
{
    public int MatchId { get; set; }
    public int MatchNumber { get; set; }
    
    public string? HomeTeamName { get; set; }
    public string? AwayTeamName { get; set; }
    
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
}