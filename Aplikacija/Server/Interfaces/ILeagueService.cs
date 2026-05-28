using Server.Dtos;

public interface ILeagueService
{
    Task<string> GenerateBracket(int leagueId);
    Task<Dictionary<int, List<BracketMatchDto>>> GetBracket(int leagueId);
    Task<string> AssignOfficials(int matchId, AssignOfficialsDto dto);
}