namespace Server.DTOs;
public class LeagueLeaderboardDto
{
    public int LeagueId { get; set; }

    public List<PlayerLeaderboardItemDto> TopScorers { get; set; } = new();
    public List<PlayerLeaderboardItemDto> TopAssists { get; set; } = new();
    public List<PlayerLeaderboardItemDto> MVP { get; set; } = new();
}

public class PlayerLeaderboardItemDto
{
    public int UserId { get; set; }
    public required  string Username { get; set; }

    public int GamesPlayed { get; set; }

    public int Points { get; set; }
    public int Assists { get; set; }
    public int Rebounds { get; set; }

    public double MVPScore { get; set; }
}