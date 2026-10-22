using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models;

public class MatchPlay
{
    public int Id { get; set; }

    public int MatchId { get; set; }
    public Match? Match { get; set; }

    public string PlayerName { get; set; } = "Nepoznat igrač";

    public string TeamSide { get; set; } = "home";

    public string Text { get; set; } = string.Empty;

    public string CurrentScore { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}