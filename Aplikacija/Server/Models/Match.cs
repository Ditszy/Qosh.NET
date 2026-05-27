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
    [InverseProperty("RefereedMatches")]
    public User? Referee { get; set; }

    [JsonIgnore]
    [InverseProperty("ScoredMatches")]
    public User? Scorer { get; set; }

    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }

    public DateTime StartTime { get; set; }
    public int RoundNumber { get; set; }
    public int MatchNumber { get; set; }
    public string? Location { get; set; }

    public MatchStatus Status { get; set; }

    [JsonIgnore]
    public List<UserMatchStats> UserStats { get; set; } = new();
}
