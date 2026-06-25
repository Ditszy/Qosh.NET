using System.ComponentModel.DataAnnotations;

namespace Server.DTOs;

public class UpdateLeagueRulesDto
{
    [Required]
    public required Enums.MatchType MatchType { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Kotizacija ne može biti negativna.")]
    public int EntryFee { get; set; }

    public string? Description { get; set; }
    
    [Range(2, 100)]
    public int MaxTeams { get; set; }

    public string? Location { get; set; }
    public double? Longitude { get; set; }
    public double? Latitude { get; set; }

    public DateTime StartDate { get; set; }
}