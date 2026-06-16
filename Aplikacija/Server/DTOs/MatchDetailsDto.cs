using Server.Enums;

namespace Server.DTOs;

public class MatchDetailsDto
{
    public int Id { get; set; }
    public string LeagueName { get; set; } = string.Empty;
    public string HomeTeamName { get; set; } = string.Empty;
    public string AwayTeamName { get; set; } = string.Empty;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public MatchStatus Status { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string RefereeName { get; set; } = string.Empty;
    public string ScorerName { get; set; } = string.Empty;
    public string? HomeTeamLogoUrl { get; set; }
    public string? AwayTeamLogoUrl { get; set; }
    public string? RefereeReport { get; set; }
    public List<MatchPlayDto> Plays { get; set; } = new();
    }