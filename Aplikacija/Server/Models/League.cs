using System.Text.Json.Serialization;

namespace Server.Models;

public class League
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public string? Season { get; set; }

    public required Enums.MatchType MatchType { get; set; }
    public Enums.LeagueStatus? LeagueStatus{ get; set; } = Enums.LeagueStatus.Registration;
    public required DateTime RegistrationDeadline { get; set; }
    public required bool IsPublic { get; set; }
    public string? Description { get; set; }
    public int MaxTeams { get; set; }
    public int EntryFee { get; set; }
    public string? Location { get; set; }

    [JsonIgnore]
    public List<Match> Matches { get; set; } = new();

    [JsonIgnore]
    public List<Team> Teams { get; set; } = new();

    [JsonIgnore]
    public User? Creator { get; set; }
    
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    public DateTime StartDate { get; set; }
}
