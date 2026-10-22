using Server.Enums;

namespace Server.DTOs;

public class LeagueFilterDto
{
    public string? SearchTerm { get; set; }
    public Enums.MatchType? MatchType { get; set; }
    public string? StatusFilter { get; set; } // "Registration", "Live", "Finsihed", else all
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}