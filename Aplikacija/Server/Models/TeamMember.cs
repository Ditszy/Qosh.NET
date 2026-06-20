using System.Text.Json.Serialization;
using Server.Enums;

namespace Server.Models;

public class TeamMember
{
    public int Id { get; set; }

    [JsonIgnore]
    public required User User { get; set; }

    [JsonIgnore]
    public required Team Team { get; set; }

    public DateTime DateJoined { get; set; }
    public bool Active { get; set; } = true;

    public UserRole? RoleInTeam { get; set; }
    public int? JerseyNumber { get; set; }
}
