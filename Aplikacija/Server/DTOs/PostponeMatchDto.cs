using System.ComponentModel.DataAnnotations;

namespace Server.DTOs;

public class PostponeMatchDto
{
    [Required]
    public int MatchId { get; set; }

    [Required]
    public DateTime NewStartTime { get; set; }

    public string? NewLocation { get; set; }
}