namespace Server.Models;

public class Vote
{
    public int Id { get; set; }

    public int MatchId { get; set; }
    public Match? Match { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int? TeamId { get; set; }

}