using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;

namespace Server.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _context;

    public StatisticsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddActionAsync(AddActionDto dto)
    {
        var stats = await _context.UserMatchStats
            .Include(x => x.Match)
                .ThenInclude(m => m!.League)
            .Include(x => x.User)
            .FirstOrDefaultAsync(x =>
                x.Match!.Id == dto.MatchId &&
                x.User!.Id == dto.UserId);

        if (stats == null)
            throw new Exception("Stats not found.");
        
        var matchType = stats.Match?.League?.MatchType;

        if (matchType == null)
             throw new Exception("Match type not found.");
        
        switch (dto.ActionType)
        {
            case StatActionType.FreeThrowMade:
                stats.FreeThrowsMade++;
                stats.FreeThrowsAttempted++;
                stats.Points += 1;
                break;

            case StatActionType.FreeThrowMissed:
                stats.FreeThrowsAttempted++;
                break;

            case StatActionType.TwoPointerMade:
                stats.TwoPointersMade++;
                stats.TwoPointersAttempted++;

                stats.Points += matchType == Enums.MatchType.Basket_3X3 ? 1 : 2;
                    break;

            case StatActionType.TwoPointerMissed:
                stats.TwoPointersAttempted++;
                break;

            case StatActionType.ThreePointerMade:
                stats.ThreePointersMade++;
                stats.ThreePointersAttempted++;

                stats.Points += matchType == Enums.MatchType.Basket_3X3 ? 2 : 3;
                    break;

            case StatActionType.ThreePointerMissed:
                stats.ThreePointersAttempted++;
                break;

            case StatActionType.Rebound:
                stats.Rebounds++;
                break;

            case StatActionType.Assist:
                stats.Assists++;
                break;

            case StatActionType.Foul:
                stats.Fouls++;
                break;

            case StatActionType.Steal:
                stats.Steals++;
                break;

            case StatActionType.Block:
                stats.Blocks++;
                break;
        }

        await _context.SaveChangesAsync();
    }
     public async Task<PlayerStatsDto> GetPlayerStatsAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
            throw new Exception("User not found");

        var stats = await _context.UserMatchStats
            .Include(x => x.Match)
                .ThenInclude(m => m!.League)
            .Where(x => x.User!.Id == userId)
            .ToListAsync();

        var grouped = stats
            .Where(x => x.Match != null && x.Match.League != null)
            .GroupBy(x => x.Match!.League!.MatchType);

        var result = new PlayerStatsDto
        {
            UserId = user.Id,
            Username = user.Username,
            StatsByMatchType = grouped.Select(g =>
            {
                var games = g.Count();

                return new MatchTypeStatsDto
                {
                    MatchType = g.Key,

                    GamesPlayed = games,

                    TotalPoints = g.Sum(x => x.Points),

                    AvgPoints = games == 0 ? 0 : g.Average(x => x.Points),
                    AvgRebounds = games == 0 ? 0 : g.Average(x => x.Rebounds),
                    AvgAssists = games == 0 ? 0 : g.Average(x => x.Assists),
                    AvgSteals = games == 0 ? 0 : g.Average(x => x.Steals),
                    AvgBlocks = games == 0 ? 0 : g.Average(x => x.Blocks),
                };
            }).ToList()
        };

        return result;
    }

     public async Task<LeagueLeaderboardDto> GetLeagueLeaderboardAsync(int leagueId)
    {
        var stats = await _context.UserMatchStats
            .Include(x => x.User)
            .Include(x => x.Match)
                .ThenInclude(m => m!.League)
            .Where(x => x.Match!.League!.Id == leagueId)
            .ToListAsync();

        var grouped = stats
            .Where(x => x.User != null)
            .GroupBy(x => x.User!.Id)
            .Select(g =>
            {
                var games = g.Count();

                var points = g.Sum(x => x.Points);
                var assists = g.Sum(x => x.Assists);
                var rebounds = g.Sum(x => x.Rebounds);

                return new PlayerLeaderboardItemDto
                {
                    UserId = g.Key,
                    Username = g.First().User!.Username,

                    GamesPlayed = games,

                    Points = points,
                    Assists = assists,
                    Rebounds = rebounds,

                    MVPScore =
                        (points * 1.0) +
                        (assists * 1.5) +
                        (rebounds * 1.2)
                };
            })
            .ToList();

        var result = new LeagueLeaderboardDto
        {
            LeagueId = leagueId,

            TopScorers = grouped
                .OrderByDescending(x => x.Points)
                .Take(10)
                .ToList(),

            TopAssists = grouped
                .OrderByDescending(x => x.Assists)
                .Take(10)
                .ToList(),

            MVP = grouped
                .OrderByDescending(x => x.MVPScore)
                .Take(10)
                .ToList()
        };

        return result;
    }
     public async Task<List<TeamStatsDto>> GetTeamStatsAsync(int leagueId)
    {
        var stats = await _context.UserMatchStats
            .Include(x => x.User)
                .ThenInclude(u => u!.TeamMembers)
                    .ThenInclude(tm => tm.Team)
            .Include(x => x.Match)
                .ThenInclude(m => m!.League)
            .Where(x => x.Match!.League!.Id == leagueId)
            .ToListAsync();

        var grouped = stats
            .Where(x =>
                x.User != null &&
                x.User.TeamMembers.Any(tm => tm.Active))
            .Select(x => new
            {
                Team = x.User!.TeamMembers.First(tm => tm.Active).Team,
                x.Points,
                x.Rebounds,
                x.TwoPointersMade,
                x.ThreePointersMade,
                x.TwoPointersAttempted,
                x.ThreePointersAttempted
            })
            .GroupBy(x => x.Team!.Id)
            .Select(g =>
            {
                var games = stats
                    .Where(s =>
                        s.Match != null &&
                        s.User!.TeamMembers.Any(tm =>
                            tm.Team!.Id == g.Key))
                    .Select(s => s.Match!.Id)
                    .Distinct()
                    .Count();

                var totalPoints = g.Sum(x => x.Points);
                var totalRebounds = g.Sum(x => x.Rebounds);

                var made = g.Sum(x => x.TwoPointersMade + x.ThreePointersMade);
                var attempted = g.Sum(x => x.TwoPointersAttempted + x.ThreePointersAttempted);

                return new TeamStatsDto
                {
                    TeamId = g.Key,
                    TeamName = g.First().Team!.Name,

                    GamesPlayed = games,

                    TotalPoints = totalPoints,
                    TotalRebounds = totalRebounds,

                    AvgPoints = games == 0 ? 0 : (double)totalPoints / games,
                    AvgRebounds = games == 0 ? 0 : (double)totalRebounds / games,

                    FieldGoalPercentage =
                        attempted == 0 ? 0 : (double)made / attempted * 100
                };
            })
            .ToList();

        return grouped;
    }
}