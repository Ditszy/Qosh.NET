namespace Server.Models;
public class UserMatchStats
{
    public int ID{get; set;}
    public required int userId{get;set;}
    public required int matchId{get; set;}
    public required int points{get; set;}
    public required int freeThrowsMade{get; set;}
    public required int freeThrowsAttempted{get; set;}
    public required int twoPointersMade{get; set;}
    public required int twoPointersAttempted{get; set;}
    public required int threePointersMade{get; set;}
    public required int threePointersAttempted{get; set;}
    public int rebounds{get; set;}
    public int assists{get; set;}
    public int fouls{get; set;}
    public int steals{get; set;}
    public int blocks{get; set;}
}