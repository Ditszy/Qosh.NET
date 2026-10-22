using Server.Models;

namespace Server.DTOs;

public class CreateTeamDto
{
    public required string Name { get; set; }
    public required int LeagueId {get; set;}
    public string? City { get; set; }
}