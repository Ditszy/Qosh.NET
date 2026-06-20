namespace Server.DTOs;

public class UserProfileDto
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? GlobalRole { get; set; }
    public string? ProfilePictureUrl { get; set; }
    
    public List<UserTeamDto> Teams { get; set; } = new();
    public List<UserMatchHistoryDto> MatchHistory { get; set; } = new();
}

public class UserTeamDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = null!;
    public int LeagueId { get; set; }
    public string? LeagueName { get; set; }
    public string? RoleInTeam { get; set; }
    public bool IsActiveInTeam { get; set; }
    public string? LogoUrl { get; set; }
}

public class UserMatchHistoryDto
{
    public int MatchId { get; set; }
    public string HomeTeamName { get; set; } = null!;
    public string AwayTeamName { get; set; } = null!;
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public DateTime StartTime { get; set; }
    public string MatchStatus { get; set; } = null!;
    public int Points { get; set; }
    public int Assists { get; set; }
    public int Rebounds { get; set; }
    public int Steals { get; set; }
    public int Blocks { get; set; }
    public int Fouls { get; set; }
    public int TwoPointersMade { get; set; }
    public int TwoPointersAttempted { get; set; }
    public int ThreePointersMade { get; set; }
    public int ThreePointersAttempted { get; set; }
    public int FreeThrowsMade { get; set; }
    public int FreeThrowsAttempted { get; set; }
}