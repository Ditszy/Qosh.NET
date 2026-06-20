using System.ComponentModel.DataAnnotations;

namespace Server.DTOs;

public class CreateLeagueDto
{
    [Required]
    [StringLength(100)]
    public required string Name { get; set; }

    public string? Season { get; set; }

    [Required]
    public required Enums.MatchType MatchType { get; set; }

    [Required]
    public required DateTime RegistrationDeadline { get; set; }

    [Required]
    public required bool IsPublic { get; set; }

    public string? Description { get; set; }

    [Range(2, 100, ErrorMessage = "Broj timova mora biti između 2 i 100.")]
    public int MaxTeams { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Kotizacija ne može biti negativna.")]
    public int EntryFee { get; set; }

    public string? Location { get; set; }
}