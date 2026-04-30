using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Server.Enums;

namespace Server.Models;

public class TeamInvite
{
    public int Id { get; set; }

    [JsonIgnore]
    public Team? Team { get; set; }

    [JsonIgnore]
    [InverseProperty("InvitesReceived")]
    public User? Invitee { get; set; }

    [JsonIgnore]
    [InverseProperty("InvitesSent")]
    public User? Sender { get; set; }

    public required InviteStatus Status { get; set; }
    public required DateTime SentAt { get; set; }
}
