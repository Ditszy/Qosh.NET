using Server.DTOs;

namespace Server.Interfaces;

public interface ILeagueService
{
    Task<string> GenerateBracket(int leagueId, int currentUserId);
    Task<Dictionary<int, List<BracketMatchDto>>> GetBracket(int leagueId);
    Task<string> AssignOfficials(int matchId, AssignOfficialsDto dto, int currentUserId);
    Task<PagedResultDto<object>> GetActiveLeaguesAsync(LeagueFilterDto filter);
    Task<string> FinishLeague(int leagueId, int currentUserId);
}