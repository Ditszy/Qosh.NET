using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class AssignOfficialsDto
{
    [Required]
    public int MatchId { get; set; }
    
    public int? RefereeId { get; set; }
    public int? ScorerId { get; set; }
}