using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Server.Enums;

namespace Server.Models;

public class User
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
    public required string Email { get; set; }
    public UserRole? GlobalRole { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    [JsonIgnore]
    public List<TeamMember> TeamMembers { get; set; } = new();

    [JsonIgnore]
    public List<Match> RefereedMatches { get; set; } = new();

    [JsonIgnore]
    public List<Match> ScoredMatches { get; set; } = new();

    [JsonIgnore]
    public List<UserMatchStats> MatchStats { get; set; } = new();

    [JsonIgnore]
    public List<League> CreatedLeagues { get; set; } = new();

    [JsonIgnore]
    [InverseProperty("Invitee")]
    public List<TeamInvite> InvitesReceived { get; set; } = new();

    [JsonIgnore]
    [InverseProperty("Sender")]
    public List<TeamInvite> InvitesSent { get; set; } = new();
}
