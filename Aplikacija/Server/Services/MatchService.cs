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
    private readonly INotificationService _notificationService;

    public MatchService(AppDbContext context, IHubContext<MatchHub> hubContext, INotificationService notificationService)
    {
        _context = context;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<string> StartMatchAsync(int id, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.Scorer)
            .Include(m => m.UserStats)
            .Include(m => m.HomeTeam)
                .ThenInclude(t => t.TeamMembers!)
                    .ThenInclude(tm => tm.User)
            .Include(m => m.AwayTeam)
                .ThenInclude(t => t.TeamMembers!)
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
            Status = (int)match.Status,
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
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveStatusUpdate", new
        {
            MatchId = id,
            Status = (int)match.Status
        });

        return "OK";
    }

    public async Task<string> EndMatchAsync(int id, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.Scorer)
            .Include(m => m.League)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return "Utakmica nije pronadjena";

        if (requestUserRole != UserRoles.Admin && (match.Scorer == null || match.Scorer.Id != requestUserId))
            return "Nemate ovlascenje";

        if (match.Status != MatchStatus.Live)
            return "Utakmica nije uzivo";

        match.Status = MatchStatus.Finished;

        if (match.League != null && match.League.MatchType == Enums.MatchType.Basket_3X3)
        {
            var winner = (match.HomeScore > match.AwayScore) ? match.HomeTeam : match.AwayTeam;

            if (winner != null)
            {
                int nextRound = match.RoundNumber + 1;
                int nextMatchNum = (match.MatchNumber + 1) / 2;

                var nextMatch = await _context.Matches
                    .FirstOrDefaultAsync(m => m.League!.Id == match.League.Id &&
                                             m.RoundNumber == nextRound &&
                                             m.MatchNumber == nextMatchNum);

                if (nextMatch != null)
                {
                    if (match.MatchNumber % 2 != 0)
                        nextMatch.HomeTeam = winner;
                    else
                        nextMatch.AwayTeam = winner;
                }
            }
        }

        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveStatusUpdate", new
        {
            MatchId = id,
            Status = (int)match.Status
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

        match.RefereeReport = dto.ReportText;
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

        var plays = await _context.MatchPlays
            .Where(p => p.MatchId == matchId)
            .OrderByDescending(p => p.Id)
            .Select(p => new MatchPlayDto
            {
                Id = p.Id,
                Time = "",
                Team = p.TeamSide,
                Text = p.Text,
                Score = p.CurrentScore
            })
            .ToListAsync();

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
            ScorerName = match.Scorer != null ? $"{match.Scorer.FirstName} {match.Scorer.LastName}" : "Nije dodeljen",
            HomeTeamLogoUrl = match.HomeTeam?.LogoUrl,
            AwayTeamLogoUrl = match.AwayTeam?.LogoUrl,
            RefereeReport = match.RefereeReport,
            Plays = plays
        };
    }

    public async Task<MatchBoxScoreDto> GetMatchBoxScoreAsync(int matchId)
    {
        var match = await _context.Matches
            .Include(m => m.HomeTeam).ThenInclude(t => t!.TeamMembers!).ThenInclude(tm => tm.User)
            .Include(m => m.AwayTeam).ThenInclude(t => t!.TeamMembers!).ThenInclude(tm => tm.User)
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
                        Username = tm.User.Username,
                        JerseyNumber = tm.JerseyNumber,
                        Points = stats?.Points ?? 0,
                        Rebounds = stats?.Rebounds ?? 0,
                        Assists = stats?.Assists ?? 0,
                        Fouls = stats?.Fouls ?? 0,
                        Steals = stats?.Steals ?? 0,
                        Blocks = stats?.Blocks ?? 0,
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

    public async Task<List<MatchDetailsDto>> GetAssignedMatchesAsync(int userId, string role)
    {
        var query = _context.Matches
            .Include(m => m.League)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Scorer)
            .AsQueryable();

        if (role == UserRoles.Scorer)
        {
            query = query.Where(m => m.Scorer != null && m.Scorer.Id == userId);
        }
        else if (role == UserRoles.Referee)
        {
            query = query.Where(m => m.Referee != null && m.Referee.Id == userId);
        }
        else if (role != UserRoles.Admin)
        {
            return new List<MatchDetailsDto>();
        }

        return await query.Select(m => new MatchDetailsDto
        {
            Id = m.Id,
            LeagueName = m.League != null ? m.League.Name : "Nezavisni meč",
            HomeTeamName = m.HomeTeam != null ? m.HomeTeam.Name : "TBD",
            AwayTeamName = m.AwayTeam != null ? m.AwayTeam.Name : "TBD",
            HomeScore = m.HomeScore ?? 0,
            AwayScore = m.AwayScore ?? 0,
            Status = m.Status,
            StartTime = m.StartTime.ToString("dd.MM.yyyy • HH:mm"),
            Location = m.Location ?? "",
            RefereeName = m.Referee != null ? m.Referee.Username : "",
            ScorerName = m.Scorer != null ? m.Scorer.Username : ""
        }).ToListAsync();
    }

    public async Task<string> UpdateMatchAsync(UpdateMatchDto dto, int requestUserId, string requestUserRole)
    {
        var match = await _context.Matches
            .Include(m => m.League)
                .ThenInclude(l => l!.Creator)
            .Include(m => m.HomeTeam)
                .ThenInclude(t => t!.TeamMembers!)
                    .ThenInclude(tm => tm.User)
            .Include(m => m.AwayTeam)
                .ThenInclude(t => t!.TeamMembers!)
                    .ThenInclude(tm => tm.User)
            .Include(m => m.Referee)
            .Include(m => m.Scorer)
            .FirstOrDefaultAsync(m => m.Id == dto.MatchId);

        if (match == null) return "Utakmica nije pronađena.";

        bool isOrganizer = match.League?.Creator?.Id == requestUserId;
        if (requestUserRole != UserRoles.Admin && !isOrganizer)
            return "Nemate ovlašćenja za izmenu ove utakmice.";

        if (match.Status == MatchStatus.Finished)
            return "Nije moguće izmeniti završenu utakmicu.";

        bool detailsChanged = match.StartTime != dto.StartTime || match.Location != dto.Location;

        match.StartTime = dto.StartTime;
        match.Location = dto.Location;

        if (dto.RefereeId.HasValue)
        {
            var referee = await _context.Users.FindAsync(dto.RefereeId.Value);
            if (referee == null || (referee.GlobalRole != UserRole.Referee && referee.GlobalRole != UserRole.Admin))
                return "Izabrani korisnik ne može biti sudija.";
            match.Referee = referee;
        }
        else match.Referee = null;

        if (dto.ScorerId.HasValue)
        {
            var scorer = await _context.Users.FindAsync(dto.ScorerId.Value);
            if (scorer == null || (scorer.GlobalRole != UserRole.Scorer && scorer.GlobalRole != UserRole.Admin))
                return "Izabrani korisnik ne može biti zapisničar.";
            match.Scorer = scorer;
        }
        else match.Scorer = null;

        await _context.SaveChangesAsync();

        if (detailsChanged)
        {
            var userIdsToNotify = new HashSet<int>();

            if (match.HomeTeam?.TeamMembers != null)
                foreach (var tm in match.HomeTeam.TeamMembers) if (tm.Active && tm.User != null) userIdsToNotify.Add(tm.User.Id);

            if (match.AwayTeam?.TeamMembers != null)
                foreach (var tm in match.AwayTeam.TeamMembers) if (tm.Active && tm.User != null) userIdsToNotify.Add(tm.User.Id);

            if (match.Referee != null) userIdsToNotify.Add(match.Referee.Id);
            if (match.Scorer != null) userIdsToNotify.Add(match.Scorer.Id);

            if (userIdsToNotify.Any())
            {
                await _notificationService.SendNotificationToMultipleUsersAsync(
                    userIdsToNotify.ToList(),
                    "Izmena termina/lokacije utakmice",
                    $"Utakmica {match.HomeTeam?.Name} vs {match.AwayTeam?.Name} je pomerena na {match.StartTime:dd.MM.yyyy HH:mm} na lokaciji {match.Location}.",
                    NotificationType.MatchRescheduled,
                    relatedMatchId: match.Id
                );
            }
        }

        return "OK";
    }

    public async Task<List<MatchDetailsDto>> GetLiveMatchesAsync()
    {
        var matches = await _context.Matches
            .Include(m => m.League)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Scorer)
            .Where(m => m.Status == MatchStatus.Live || m.Status == MatchStatus.Paused)
            .OrderByDescending(m => m.StartTime)
            .Take(5)
            .Select(m => new MatchDetailsDto
            {
                Id = m.Id,
                LeagueName = m.League != null ? m.League.Name : "Nezavisni meč",
                HomeTeamName = m.HomeTeam != null ? m.HomeTeam.Name : "TBD",
                AwayTeamName = m.AwayTeam != null ? m.AwayTeam.Name : "TBD",
                HomeScore = m.HomeScore ?? 0,
                AwayScore = m.AwayScore ?? 0,
                Status = m.Status,
                StartTime = m.StartTime.ToString("dd.MM.yyyy • HH:mm"),
                Location = m.Location ?? "",
                RefereeName = m.Referee != null ? m.Referee.Username : "",
                ScorerName = m.Scorer != null ? m.Scorer.Username : "",
                HomeTeamLogoUrl = m.HomeTeam != null ? m.HomeTeam.LogoUrl : null,
                AwayTeamLogoUrl = m.AwayTeam != null ? m.AwayTeam.LogoUrl : null
            })
            .ToListAsync();

        return matches;
    }
}