namespace Server.Models;
public class League
{
    public int ID{get; set;}
    public required string name{get; set;}
    public required MatchType matchType{get; set;}
    public required DateTime registrationDeadline{get; set;}
    public required bool isPublic{get; set;}
    public string? description{get; set;}
    public int maxTeams{get; set;}
    public int kotizacija{get; set;}
}