using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Server.Constants;
using Hubs;
using Server.Models;

namespace Server.Services;

public class MatchService : IMatchService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<MatchHub> _hubContext;

    public MatchService(AppDbContext context, IHubContext<MatchHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task<string> StartMatchAsync(int id, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.Scorer)
            .Include(m => m.UserStats)
            .Include(m => m.HomeTeam)
                .ThenInclude(t => t.TeamMembers)
                    .ThenInclude(tm => tm.User)
            .Include(m => m.AwayTeam)
                .ThenInclude(t => t.TeamMembers)
                    .ThenInclude(tm => tm.User)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return "Utakmica nije pronadjena";

        if (requestUserRole != UserRoles.Admin && (match.Scorer == null || match.Scorer.Id != requestUserId))
            return "Nemate ovlascenja";

        if (match.Status == MatchStatus.Finished || match.Status == MatchStatus.Canceled)
            return "Utakmica je zavrsena ili otkazana";

        if (match.UserStats == null)
        {
            match.UserStats = new List<UserMatchStats>();
        }

        if (!match.UserStats.Any())
        {
            if (match.HomeTeam?.TeamMembers != null)
            {
                foreach (var member in match.HomeTeam.TeamMembers.Where(tm => tm.Active))
                {
                    var stats = CreateEmptyStats(member.User, match);
                    match.UserStats.Add(stats);
                }
            }

            if (match.AwayTeam?.TeamMembers != null)
            {
                foreach (var member in match.AwayTeam.TeamMembers.Where(tm => tm.Active))
                {
                    var stats = CreateEmptyStats(member.User, match);
                    match.UserStats.Add(stats);
                }
            }
        }

        match.Status = MatchStatus.Live;

        if (match.HomeScore == null) match.HomeScore = 0;
        if (match.AwayScore == null) match.AwayScore = 0;

        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveStatusUpdate", new
        {
            MatchId = id,
            Status = match.Status.ToString(),
            HomeScore = match.HomeScore,
            AwayScore = match.AwayScore
        });

        return "OK";
    }
    private UserMatchStats CreateEmptyStats(User user, Match match)
    {
        return new UserMatchStats
        {
            User = user,
            Match = match,
            Points = 0,
            FreeThrowsMade = 0,
            FreeThrowsAttempted = 0,
            TwoPointersMade = 0,
            TwoPointersAttempted = 0,
            ThreePointersMade = 0,
            ThreePointersAttempted = 0,
            Rebounds = 0,
            Assists = 0,
            Fouls = 0,
            Steals = 0,
            Blocks = 0
        };
    }

    public async Task<string> PauseMatchAsync(int id, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.Scorer)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return "Utakmica nije pronadjena";

        if (requestUserRole != UserRoles.Admin && (match.Scorer == null || match.Scorer.Id != requestUserId))
            return "Nemate ovlascenje";

        if (match.Status != MatchStatus.Live)
            return "Utakmica nije pocela";

        match.Status = MatchStatus.Paused;

        await _hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveStatusUpdate", new
        {
            MatchId = id,
            Status = match.Status.ToString()
        });

        return "OK";
    }

    public async Task<string> EndMatchAsync(int id, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.Scorer)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return "Utakmica nije pronadjena";

        if (requestUserRole != UserRoles.Admin && (match.Scorer == null || match.Scorer.Id != requestUserId))
            return "Nemate ovlascenje";

        if (match.Status != MatchStatus.Live)
            return "Utakmica nije uzivo";

        match.Status = MatchStatus.Finished;
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveStatusUpdate", new
        {
            MatchId = id,
            Status = match.Status.ToString()
        });

        return "OK";
    }

    public async Task<string> SubmitRefereeReportAsync(int id, RefereeReportDto dto, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.Referee)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return "Utakmica nije pronadjena";

        if (requestUserRole != UserRoles.Admin && (match.Referee == null || match.Referee.Id != requestUserId))
            return "Nemate ovlascenje";

        if (match.Status != MatchStatus.Finished)
            return "Utakmica nije zavrsena";

        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<string> AssignMVPOfMatchAsync(int id, int userId, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.Referee)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return "Utakmica nije pronadjena";

        if (requestUserRole != UserRoles.Admin && (match.Referee == null || match.Referee.Id != requestUserId))
            return "Nemate ovlascenje";

        if (match.Status != MatchStatus.Finished)
            return "Nije se zavrsila utakmica jos uvek";

        var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return "Korisnik sa tim ID-jem ne postoji.";

        // match.MvpUser da se postavi, treba izmena modela
        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<MatchDetailsDto?> GetMatchDetailsAsync(int matchId)
    {
        var match = await _context.Matches
            .Include(m => m.League)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Scorer)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null) return null;

        return new MatchDetailsDto
        {
            Id = match.Id,
            LeagueName = match.League?.Name ?? "Nezavisni meč",
            HomeTeamName = match.HomeTeam?.Name ?? "Domaći Tim",
            AwayTeamName = match.AwayTeam?.Name ?? "Gostujući Tim",
            HomeScore = match.HomeScore ?? 0,
            AwayScore = match.AwayScore ?? 0,
            Status = match.Status,
            StartTime = match.StartTime.ToString("dd.MM.yyyy • HH:mm"),
            Location = match.Location ?? "Nije definisana",
            RefereeName = match.Referee != null ? $"{match.Referee.FirstName} {match.Referee.LastName}" : "Nije dodeljen",
            ScorerName = match.Scorer != null ? $"{match.Scorer.FirstName} {match.Scorer.LastName}" : "Nije dodeljen"
        };
    }

    public async Task<MatchBoxScoreDto> GetMatchBoxScoreAsync(int matchId)
    {
        var match = await _context.Matches
            .Include(m => m.HomeTeam).ThenInclude(t => t!.TeamMembers).ThenInclude(tm => tm.User)
            .Include(m => m.AwayTeam).ThenInclude(t => t!.TeamMembers).ThenInclude(tm => tm.User)
            .Include(m => m.UserStats).ThenInclude(us => us.User)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        var result = new MatchBoxScoreDto();
        if (match == null) return result;

        List<PlayerBoxScoreItemDto> MapRoster(Team? team)
        {
            if (team == null || team.TeamMembers == null) return new List<PlayerBoxScoreItemDto>();

            return team.TeamMembers
                .Where(tm => tm.User != null)
                .Select(tm =>
                {
                    var stats = match.UserStats?.FirstOrDefault(us => us.User != null && us.User.Id == tm.User!.Id);

                    return new PlayerBoxScoreItemDto
                    {
                        Id = tm.User!.Id,
                        Name = $"{tm.User.FirstName} {tm.User.LastName}",
                        Points = stats?.Points ?? 0,
                        Rebounds = stats?.Rebounds ?? 0,
                        Assists = stats?.Assists ?? 0,
                        Fouls = stats?.Fouls ?? 0,
                        TwoPointsMade = stats?.TwoPointersMade ?? 0,
                        TwoPointsAttempted = stats?.TwoPointersAttempted ?? 0,
                        ThreePointsMade = stats?.ThreePointersMade ?? 0,
                        ThreePointsAttempted = stats?.ThreePointersAttempted ?? 0,
                        FreeThrowsMade = stats?.FreeThrowsMade ?? 0,
                        FreeThrowsAttempted = stats?.FreeThrowsAttempted ?? 0
                    };
                }).ToList();
        }

        result.HomeRoster = MapRoster(match.HomeTeam);
        result.AwayRoster = MapRoster(match.AwayTeam);

        return result;
    }
}