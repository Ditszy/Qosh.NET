namespace Server.Models;

public class UserMatchStats
{
    public int Id { get; set; }

    public User? User { get; set; }

    public Match? Match { get; set; }

    public required int Points { get; set; }
    public required int FreeThrowsMade { get; set; }
    public required int FreeThrowsAttempted { get; set; }
    public required int TwoPointersMade { get; set; }
    public required int TwoPointersAttempted { get; set; }
    public required int ThreePointersMade { get; set; }
    public required int ThreePointersAttempted { get; set; }
    public int Rebounds { get; set; }
    public int Assists { get; set; }
    public int Fouls { get; set; }
    public int Steals { get; set; }
    public int Blocks { get; set; }
}
