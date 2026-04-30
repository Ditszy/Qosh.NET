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

    public DateTime DatumPristupa { get; set; }
    public bool Aktivan { get; set; }

    public UserRole? RoleInTeam { get; set; }
}
