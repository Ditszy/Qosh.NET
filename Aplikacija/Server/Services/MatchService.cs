using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Server.Constants;
using Hubs;

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
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null)
            return "Utakmica nije pronadjena";

        if (requestUserRole != UserRoles.Admin && (match.Scorer == null || match.Scorer.Id != requestUserId))
            return "Nemate ovlascenja";

        if (match.Status == MatchStatus.Finished || match.Status == MatchStatus.Canceled)
            return "Utakmica je zavrsena ili otkazana";

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
}