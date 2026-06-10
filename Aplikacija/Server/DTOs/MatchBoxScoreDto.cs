namespace Server.DTOs;

public class MatchBoxScoreDto
{
    public List<PlayerBoxScoreItemDto> HomeRoster { get; set; } = new();
    public List<PlayerBoxScoreItemDto> AwayRoster { get; set; } = new();
}

public class PlayerBoxScoreItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Points { get; set; }
    public int Rebounds { get; set; }
    public int Assists { get; set; }
    public int Fouls { get; set; }
    public int TwoPointsMade { get; set; }
    public int TwoPointsAttempted { get; set; }
    public int ThreePointsMade { get; set; }
    public int ThreePointsAttempted { get; set; }
    public int FreeThrowsMade { get; set; }
    public int FreeThrowsAttempted { get; set; }
}