using Server.DTOs;

namespace Server.Interfaces;
public interface IStatisticsService
{
    Task AddActionAsync(AddActionDto dto);
    Task<PlayerStatsDto> GetPlayerStatsAsync(int userId);
    Task<LeagueLeaderboardDto> GetGlobalLeaderboardAsync(int? leagueId);
    Task<List<TeamStatsDto>> GetTeamStatsAsync(int leagueId);
    Task<List<PlayerMatchHistoryDto>> GetPlayerRecentMatchesAsync(int userId, int limit = 10);
}