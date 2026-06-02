namespace Server.DTOs;
using Server.Enums;

public class PlayerStatsDto
{
    public int UserId { get; set; }
    public required  string Username { get; set; }

    public List<MatchTypeStatsDto> StatsByMatchType { get; set; } = new();
}

public class MatchTypeStatsDto
{
    public MatchType MatchType { get; set; }

    public int GamesPlayed { get; set; }

    public int TotalPoints { get; set; }
    public double AvgPoints { get; set; }

    public double AvgRebounds { get; set; }
    public double AvgAssists { get; set; }
    public double AvgSteals { get; set; }
    public double AvgBlocks { get; set; }
}