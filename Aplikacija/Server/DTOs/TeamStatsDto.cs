namespace Server.DTOs;

public class TeamStatsDto
{
    public int TeamId { get; set; }
    public required  string TeamName { get; set; }

    public int GamesPlayed { get; set; }

    public int TotalPoints { get; set; }
    public int TotalRebounds { get; set; }

    public double AvgPoints { get; set; }
    public double AvgRebounds { get; set; }

    public double FieldGoalPercentage { get; set; }
}