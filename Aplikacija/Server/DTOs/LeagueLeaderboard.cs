namespace Server.DTOs;

public class LeagueLeaderboardDto
{
    public int? LeagueId { get; set; }

    public List<PlayerLeaderboardItemDto> TopScorers { get; set; } = new();
    public List<PlayerLeaderboardItemDto> TopAssists { get; set; } = new();
    public List<PlayerLeaderboardItemDto> TopRebounders { get; set; } = new();
    public List<PlayerLeaderboardItemDto> TopStealers { get; set; } = new();
    public List<PlayerLeaderboardItemDto> TopBlockers { get; set; } = new();
    public List<PlayerLeaderboardItemDto> MVP { get; set; } = new();
}

public class PlayerLeaderboardItemDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string? ProfilePictureUrl { get; set; }
    public int GamesPlayed { get; set; }
    public int Points { get; set; }
    public int Assists { get; set; }
    public int Rebounds { get; set; }
    public int Steals { get; set; }
    public int Blocks { get; set; }
    public double MVPScore { get; set; }
}