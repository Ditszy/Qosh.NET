using Server.Enums;

namespace Server.DTOs;

public class LeagueDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Season { get; set; }
    public Enums.MatchType MatchType { get; set; }
    public string RegistrationDeadline { get; set; } = string.Empty;
    public int MaxTeams { get; set; }
    public int EntryFee { get; set; }
    public int TeamCount { get; set; }
}
