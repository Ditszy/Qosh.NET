using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Hubs;
using Server.Models;

namespace Server.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<MatchHub> _hubContext;

    public StatisticsService(AppDbContext context, IHubContext<MatchHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task AddActionAsync(AddActionDto dto)
    {
        var stats = await _context.UserMatchStats
            .Include(x => x.Match)
                .ThenInclude(m => m!.League)
            .Include(x => x.Match)
                .ThenInclude(m => m!.HomeTeam)
            .Include(x => x.Match)
                .ThenInclude(m => m!.AwayTeam)
            .Include(x => x.User)
            .FirstOrDefaultAsync(x =>
                x.Match!.Id == dto.MatchId &&
                x.User!.Id == dto.UserId);

        if (stats == null)
            throw new Exception("Stats not found.");

        var match = stats.Match;
        var matchType = match?.League?.MatchType;

        if (matchType == null)
            throw new Exception("Match type not found.");

        string actionName = "";
        int pointsAdded = 0;

        switch (dto.ActionType)
        {
            case StatActionType.FreeThrowMade:
                stats.FreeThrowsMade++;
                stats.FreeThrowsAttempted++;
                pointsAdded = 1;
                actionName = "pogodio slobodno bacanje";
                break;
            case StatActionType.FreeThrowMissed:
                stats.FreeThrowsAttempted++;
                actionName = "promašio slobodno bacanje";
                break;
            case StatActionType.TwoPointerMade:
                stats.TwoPointersMade++;
                stats.TwoPointersAttempted++;
                pointsAdded = matchType == Enums.MatchType.Basket_3X3 ? 1 : 2;
                actionName = "postigao pogodak za 2 poena";
                break;
            case StatActionType.TwoPointerMissed:
                stats.TwoPointersAttempted++;
                actionName = "promašio šut za 2 poena";
                break;
            case StatActionType.ThreePointerMade:
                stats.ThreePointersMade++;
                stats.ThreePointersAttempted++;
                pointsAdded = matchType == Enums.MatchType.Basket_3X3 ? 2 : 3;
                actionName = "pogodio trojku!";
                break;
            case StatActionType.ThreePointerMissed:
                stats.ThreePointersAttempted++;
                actionName = "promašio šut za 3 poena";
                break;
            case StatActionType.Rebound:
                stats.Rebounds++;
                actionName = "hvata skok";
                break;
            case StatActionType.Assist:
                stats.Assists++;
                actionName = "beleži asistenciju";
                break;
            case StatActionType.Foul:
                stats.Fouls++;
                actionName = "pravi ličnu grešku";
                break;
            case StatActionType.Steal:
                stats.Steals++;
                actionName = "krade loptu";
                break;
            case StatActionType.Block:
                stats.Blocks++;
                actionName = "udara blokadu!";
                break;
        }

        stats.Points += pointsAdded;

        // Update match score
        bool isHome = match!.HomeTeam != null && _context.TeamMembers.Any(tm => tm.Team.Id == match.HomeTeam.Id && tm.User.Id == dto.UserId && tm.Active);
        if (isHome) match.HomeScore = (match.HomeScore ?? 0) + pointsAdded;
        else match.AwayScore = (match.AwayScore ?? 0) + pointsAdded;

        var play = new MatchPlay
        {
            MatchId = dto.MatchId,
            PlayerName = $"{stats.User?.FirstName} {stats.User?.LastName}",
            TeamSide = isHome ? "home" : "away",
            Text = $"{stats.User?.FirstName} {stats.User?.LastName} {actionName}",
            CurrentScore = $"{match.HomeScore} - {match.AwayScore}"
        };

        _context.MatchPlays.Add(play);
        await _context.SaveChangesAsync();

        // SignalR broadcast
        var liveUpdate = new
        {
            MatchId = dto.MatchId,
            UserId = dto.UserId,
            Points = stats.Points,
            Fouls = stats.Fouls,
            Assists = stats.Assists,
            Rebounds = stats.Rebounds,
            Steals = stats.Steals,
            Blocks = stats.Blocks,
            FreeThrowsMade = stats.FreeThrowsMade,
            FreeThrowsAttempted = stats.FreeThrowsAttempted,
            TwoPointersMade = stats.TwoPointersMade,
            TwoPointersAttempted = stats.TwoPointersAttempted,
            ThreePointersMade = stats.ThreePointersMade,
            ThreePointersAttempted = stats.ThreePointersAttempted,
            ActionType = dto.ActionType.ToString(),
            HomeScore = match.HomeScore,
            AwayScore = match.AwayScore,
            NewPlay = new
            {
                id = play.Id,
                time = DateTime.UtcNow.ToString("HH:mm:ss"),
                team = play.TeamSide,
                text = play.Text,
                score = play.CurrentScore
            }
        };

        await _hubContext.Clients.Group(dto.MatchId.ToString())
            .SendAsync("ReceiveMatchUpdate", liveUpdate);
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

                var totalFgMade = g.Sum(x => x.TwoPointersMade + x.ThreePointersMade);
                var totalFgAttempted = g.Sum(x => x.TwoPointersAttempted + x.ThreePointersAttempted);
                var total2pm = g.Sum(x => x.TwoPointersMade);
                var total2pa = g.Sum(x => x.TwoPointersAttempted);
                var total3pm = g.Sum(x => x.ThreePointersMade);
                var total3pa = g.Sum(x => x.ThreePointersAttempted);
                var totalFtm = g.Sum(x => x.FreeThrowsMade);
                var totalFta = g.Sum(x => x.FreeThrowsAttempted);

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
                    AvgFouls = games == 0 ? 0 : g.Average(x => x.Fouls),

                    TotalFieldGoalsMade = totalFgMade,
                    TotalFieldGoalsAttempted = totalFgAttempted,
                    FieldGoalPercentage = totalFgAttempted == 0 ? 0 : (double)totalFgMade / totalFgAttempted * 100,

                    TotalTwoPointersMade = total2pm,
                    TotalTwoPointersAttempted = total2pa,
                    TwoPointerPercentage = total2pa == 0 ? 0 : (double)total2pm / total2pa * 100,

                    TotalThreePointersMade = total3pm,
                    TotalThreePointersAttempted = total3pa,
                    ThreePointerPercentage = total3pa == 0 ? 0 : (double)total3pm / total3pa * 100,

                    TotalFreeThrowsMade = totalFtm,
                    TotalFreeThrowsAttempted = totalFta,
                    FreeThrowPercentage = totalFta == 0 ? 0 : (double)totalFtm / totalFta * 100,
                };
            }).ToList()
        };

        return result;
    }

    public async Task<LeagueLeaderboardDto> GetGlobalLeaderboardAsync(int? leagueId = null)
    {
        var query = _context.UserMatchStats.Where(x => x.User != null);

        if (leagueId.HasValue)
        {
            query = query.Where(x => x.Match!.League!.Id == leagueId.Value);
        }

        var groupedStats = await query
            .GroupBy(x => new { x.User!.Id, x.User.Username, x.User.ProfilePictureUrl })
            .Select(g => new PlayerLeaderboardItemDto
            {
                UserId = g.Key.Id,
                Username = g.Key.Username,
                ProfilePictureUrl = g.Key.ProfilePictureUrl,
                GamesPlayed = g.Count(),
                Points = g.Sum(x => x.Points),
                Assists = g.Sum(x => x.Assists),
                Rebounds = g.Sum(x => x.Rebounds),
                Steals = g.Sum(x => x.Steals),
                Blocks = g.Sum(x => x.Blocks),

                MVPScore = (g.Sum(x => x.Points) * 1.0) +
                           (g.Sum(x => x.Assists) * 1.5) +
                           (g.Sum(x => x.Rebounds) * 1.2) +
                           (g.Sum(x => x.Steals) * 1.5) +
                           (g.Sum(x => x.Blocks) * 1.5)
            })
            .ToListAsync();

        var result = new LeagueLeaderboardDto
        {
            LeagueId = leagueId,

            TopScorers = groupedStats
                .OrderByDescending(x => x.Points)
                .Take(10)
                .ToList(),

            TopAssists = groupedStats
                .OrderByDescending(x => x.Assists)
                .Take(10)
                .ToList(),

            TopRebounders = groupedStats
                .OrderByDescending(x => x.Rebounds)
                .Take(10)
                .ToList(),

            TopStealers = groupedStats
                .OrderByDescending(x => x.Steals)
                .Take(10)
                .ToList(),

            TopBlockers = groupedStats
                .OrderByDescending(x => x.Blocks)
                .Take(10)
                .ToList(),

            MVP = groupedStats
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
    public async Task<List<PlayerMatchHistoryDto>> GetPlayerRecentMatchesAsync(int userId, int limit = 10)
    {
        return await _context.UserMatchStats
            .Where(x => x.User!.Id == userId)
            .OrderByDescending(x => x.Match!.StartTime)
            .Take(limit)
            .Select(x => new PlayerMatchHistoryDto
            {
                Points = x.Points,
                Assists = x.Assists,
                Rebounds = x.Rebounds,
                Date = x.Match!.StartTime.Date
            })
            .OrderBy(x => x.Date)
            .ToListAsync();
    }
}