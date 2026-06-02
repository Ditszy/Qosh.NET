using Server.Enums;

namespace Server.DTOs;

public class AddActionDto
{
    public int MatchId { get; set; }

    public int UserId { get; set; }

    public StatActionType ActionType { get; set; }
}