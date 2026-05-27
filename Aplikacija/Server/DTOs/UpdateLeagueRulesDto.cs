using System.ComponentModel.DataAnnotations;
using Server.Enums;

namespace Server.Dtos;

public class UpdateLeagueRulesDto
{
    [Required]
    public required Enums.MatchType MatchType { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Kotizacija ne može biti negativna.")]
    public int EntryFee { get; set; }

    public string? Description { get; set; }
    
    [Range(2, 100)]
    public int MaxTeams { get; set; }
}