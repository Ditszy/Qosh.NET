namespace Server.Models;
public class Team
{
    public int ID{get; set;}
    public required string name{get; set;}
    public required int leagueId{get; set;}
    public string? logoUrl{get; set;} 
}