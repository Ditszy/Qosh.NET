using Server.Enums;

namespace Server.DTOs;

public class UpdateMatchDto
{
    public int MatchId { get; set; }
    public DateTime StartTime { get; set; }
    public string? Location { get; set; }
    public int? RefereeId { get; set; }
    public int? ScorerId { get; set; }
}
