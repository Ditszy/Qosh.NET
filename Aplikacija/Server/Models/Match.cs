using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Server.Enums;

namespace Server.Models;

public class Match
{
    public int Id { get; set; }

    [JsonIgnore]
    public League? League { get; set; }

    [JsonIgnore]
    [InverseProperty("HomeMatches")]
    public Team? HomeTeam { get; set; }

    [JsonIgnore]
    [InverseProperty("AwayMatches")]
    public Team? AwayTeam { get; set; }

    [JsonIgnore]
    [InverseProperty("SudjeniMecevi")]
    public User? Sudija { get; set; }

    [JsonIgnore]
    [InverseProperty("ZapisaniMecevi")]
    public User? Zapisnicar { get; set; }

    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }

    public DateTime StartTime { get; set; }
    public string? Location { get; set; }

    public MatchStatus Status { get; set; }

    [JsonIgnore]
    public List<UserMatchStats> UserStats { get; set; } = new();
}
