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
    public double AvgFouls { get; set; }

    public int TotalFieldGoalsMade { get; set; }
    public int TotalFieldGoalsAttempted { get; set; }
    public double FieldGoalPercentage { get; set; }

    public int TotalTwoPointersMade { get; set; }
    public int TotalTwoPointersAttempted { get; set; }
    public double TwoPointerPercentage { get; set; }

    public int TotalThreePointersMade { get; set; }
    public int TotalThreePointersAttempted { get; set; }
    public double ThreePointerPercentage { get; set; }

    public int TotalFreeThrowsMade { get; set; }
    public int TotalFreeThrowsAttempted { get; set; }
    public double FreeThrowPercentage { get; set; }
}