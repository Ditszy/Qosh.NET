using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Server.Models;

public class Team
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? City { get; set; }

    [JsonIgnore]
    public League? League { get; set; }

    public string? LogoUrl { get; set; }

    [JsonIgnore]
    public List<TeamMember>? TeamMembers { get; set; } = new();

    [JsonIgnore]
    [InverseProperty("HomeTeam")]
    public List<Match>? HomeMatches { get; set; } = new();

    [JsonIgnore]
    [InverseProperty("AwayTeam")]
    public List<Match>? AwayMatches { get; set; } = new();
}
