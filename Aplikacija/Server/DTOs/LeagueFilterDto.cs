using Server.Enums;

namespace Server.DTOs;

public class LeagueFilterDto
{
    public string? SearchTerm { get; set; }
    public Enums.MatchType? MatchType { get; set; }
    public bool? OnlyRegistrationOpen { get; set; } 
}