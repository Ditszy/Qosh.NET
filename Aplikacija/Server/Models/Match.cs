using Server.Enums;

namespace Server.Models;
public class Match
{
    public int ID{get; set;}
    public required int leagueId{get; set;}
    public required int homeTeamId{get; set;}
    public required int awayTeamId{get; set;}
    public int homeScore{get; set;}
    public int awayScore{get; set;}
    public DateTime startTime{get; set;}
    public MatchStatus status{get; set;}
}