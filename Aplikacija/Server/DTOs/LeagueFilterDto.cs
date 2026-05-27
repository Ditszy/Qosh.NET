using Server.Enums;

namespace Server.Dtos;

public class LeagueFilterDto
{
    public string? SearchTerm { get; set; }
    public Enums.MatchType? MatchType { get; set; }
    public bool? OnlyRegistrationOpen { get; set; } 
}