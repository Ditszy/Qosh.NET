using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Constants;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaguesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILeagueService _leagueService;
    private readonly INotificationService _notificationService;

    public LeaguesController(ILeagueService leagueService, AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _leagueService = leagueService;
        _notificationService = notificationService;
    }

    [HttpPost("Create-League")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> CreateLeague([FromBody] CreateLeagueDto dto)
    {

        int creatorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var creator = await _context.Users.FindAsync(creatorId);

        var newLeague = new League
        {
            Name = dto.Name,
            Season = dto.Season,
            MatchType = dto.MatchType,
            RegistrationDeadline = dto.RegistrationDeadline,
            IsPublic = dto.IsPublic,
            Description = dto.Description,
            MaxTeams = dto.MaxTeams,
            EntryFee = dto.EntryFee,
            Location = dto.Location,
            Creator = creator,
            Matches = new List<Match>(),
            Teams = new List<Team>(),
            Latitude = dto.Latitude ?? 0.0,
            Longitude = dto.Longitude ?? 0.0,
        };

        _context.Leagues.Add(newLeague);
        await _context.SaveChangesAsync();

        return Ok($"Liga '{newLeague.Name}' je kreirana.");
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLeagueById(int id)
    {
        var league = await _context.Leagues
            .Include(l => l.Creator)
            .Include(l => l.Teams)
                .ThenInclude(t => t.TeamMembers)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (league == null) return NotFound();

        var minPlayers = league.MatchType == Enums.MatchType.Basket_3X3 ? 3 : 5;

        var result = new
        {
            league.Id,
            league.Name,
            league.Season,
            league.MatchType,
            league.RegistrationDeadline,
            league.IsPublic,
            league.Description,
            league.MaxTeams,
            league.EntryFee,
            league.Location,
            league.Latitude,
            league.Longitude,
            league.LeagueStatus,
            CreatorUsername = league.Creator?.Username,
            Teams = league.Teams.Select(t => new
            {
                t.Id,
                t.Name,
                t.City,
                MemberCount = t.TeamMembers?.Count(tm => tm.Active) ?? 0,
                IsEligible = (t.TeamMembers?.Count(tm => tm.Active) ?? 0) >= minPlayers
            })
        };

        return Ok(result);
    }

    [HttpPost("Generate-Bracket/{leagueId}")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> GenerateBracket(int leagueId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out int currentUserId))
            return Unauthorized("Niste autorizovani.");

        var result = await _leagueService.GenerateBracket(leagueId, currentUserId);

        if (result.Contains("Nemate ovlašćenje"))
            return StatusCode(403, result);

        if (result.Contains("nije") ||
            result.Contains("Nema") ||
            result.Contains("već"))
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("Get-Bracket/{leagueId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBracket(int leagueId)
    {
        var result = await _leagueService.GetBracket(leagueId);

        if (result == null)
            return NotFound("Liga nije generisana ili ne postoji.");

        return Ok(result);
    }

    [HttpPost("Assign-Officials")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> AssignMatchOfficials([FromBody] AssignOfficialsDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out int currentUserId))
            return Unauthorized("Niste autorizovani.");
        //Mozda bolje da bude u match
        var result = await _leagueService.AssignOfficials(dto.MatchId, dto, currentUserId);

        if (result.Contains("Nemate ovlašćenje"))
            return StatusCode(403, result);

        if (result != "OK")
            return BadRequest(result);

        return Ok(new
        {
            message = "Službena lica su uspešno delegirana."
        });
    }

    [HttpDelete("Delete-League/{id}")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> DeleteLeague(int id)
    {
        var league = await _context.Leagues
            .Include(l => l.Matches)
            .Include(l => l.Creator)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (league == null)
        {
            return NotFound("Liga nije pronađena.");
        }

        bool hasActiveOrPastMatches = league.Matches.Any(m => m.Status != MatchStatus.Scheduled);
        if (hasActiveOrPastMatches)
        {
            return BadRequest("Nije moguće obrisati ligu jer postoje aktivni, započeti ili završeni mečevi.");
        }

        if (league.Matches.Any())
        {
            _context.Matches.RemoveRange(league.Matches);
        }

        _context.Leagues.Remove(league);
        await _context.SaveChangesAsync();

        return Ok($"Liga '{league.Name}' i svi njeni zakazani mečevi su uspešno obrisani.");
    }

    [HttpGet("Get-Active-Leagues")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveLeagues([FromQuery] LeagueFilterDto filter)
    {
        try
        {
            var result = await _leagueService.GetActiveLeaguesAsync(filter);
            return Ok(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }

    [HttpPut("Update-Rules/{id}")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> UpdateLeagueRules(int id, [FromBody] UpdateLeagueRulesDto dto)
    {
        var league = await _context.Leagues
            .Include(l => l.Matches)
            .Include(l => l.Creator)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (league == null)
        {
            return NotFound("Liga nije pronađena.");
        }

        var now = DateTime.UtcNow;
        bool isRegistrationClosed = league.RegistrationDeadline <= now;
        bool hasGeneratedMatches = league.Matches.Any();

        if (isRegistrationClosed || hasGeneratedMatches)
        {
            return BadRequest("Nije moguće izmeniti pravila lige jer su prijave zatvorene ili je kostur turnira već generisan.");
        }

        var currentTeamsCount = await _context.Entry(league).Collection(l => l.Teams).Query().CountAsync();
        if (dto.MaxTeams < currentTeamsCount)
        {
            return BadRequest($"Maksimalan broj timova ne može biti manji od trenutno prijavljenih ({currentTeamsCount} tima).");
        }

        league.MatchType = dto.MatchType;
        league.EntryFee = dto.EntryFee;
        league.Description = dto.Description;
        league.MaxTeams = dto.MaxTeams;
        league.Location = dto.Location;

        await _context.SaveChangesAsync();
        return Ok("Pravila lige su uspešno ažurirana.");
    }

    [HttpPut("Postpone")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> PostponeMatch([FromBody] PostponeMatchDto dto)
    {
        if (dto.NewStartTime <= DateTime.UtcNow)
        {
            return BadRequest("Novi termin utakmice mora biti u budućnosti.");
        }

        var match = await _context.Matches
            .Include(m => m.League)
                .ThenInclude(l => l!.Creator)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Referee)
            .Include(m => m.Scorer)
            .FirstOrDefaultAsync(m => m.Id == dto.MatchId);

        if (match == null) return NotFound("Utakmica nije pronađena.");

        if (match.Status == MatchStatus.Finished)
        {
            return BadRequest("Nije moguće odložiti utakmicu koja je već završena.");
        }

        match.StartTime = dto.NewStartTime;
        if (!string.IsNullOrWhiteSpace(dto.NewLocation))
        {
            match.Location = dto.NewLocation;
        }

        var teamIds = new List<int>();
        if (match.HomeTeam != null) teamIds.Add(match.HomeTeam.Id);
        if (match.AwayTeam != null) teamIds.Add(match.AwayTeam.Id);

        var playerIds = await _context.TeamMembers
            .Where(tm => teamIds.Contains(tm.Team.Id) && tm.Active)
            .Select(tm => tm.User.Id)
            .ToListAsync();

        await _context.SaveChangesAsync();

        var matchTitle = $"{match.HomeTeam?.Name} vs {match.AwayTeam?.Name}";
        var newTime = match.StartTime.ToString("dd.MM.yyyy HH:mm");

        if (playerIds.Any())
        {
            await _notificationService.SendNotificationToMultipleUsersAsync(
                playerIds,
                "Utakmica odložena",
                $"Vaša utakmica ({matchTitle}) je pomerena na {newTime}.",
                NotificationType.MatchRescheduled,
                relatedMatchId: match.Id
            );
        }

        if (match.Referee != null)
        {
            await _notificationService.SendNotificationAsync(
                match.Referee.Id,
                "Utakmica odložena",
                $"Utakmica ({matchTitle}) za koju ste delegirani kao sudija je pomerena na {newTime}.",
                NotificationType.MatchRescheduled,
                false,
                relatedMatchId: match.Id
            );
        }

        if (match.Scorer != null)
        {
            await _notificationService.SendNotificationAsync(
                match.Scorer.Id,
                "Utakmica odložena",
                $"Utakmica ({matchTitle}) za koju ste delegirani kao zapisničar je pomerena na {newTime}.",
                NotificationType.MatchRescheduled,
                false,
                relatedMatchId: match.Id
            );
        }

        return Ok("Utakmica je uspešno odložena i pomerena na novi termin.");
    }

    [HttpPut("Lock-Registrations/{id}")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> LockLeagueRegistrations(int id)
    {
        var league = await _context.Leagues
            .Include(l => l.Creator)
            .Include(l => l.Teams)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (league == null)
        {
            return NotFound("Liga nije pronađena.");
        }

        var now = DateTime.UtcNow;
        if (league.RegistrationDeadline <= now)
        {
            return BadRequest("Prijave za ovu ligu su već zatvorene.");
        }

        if (league.Teams.Count < 2)
        {
            return BadRequest("Ne možete zatvoriti prijave jer je potrebno da postoje najmanje 2 prijavljena tima.");
        }
        league.LeagueStatus = LeagueStatus.Live;
        league.RegistrationDeadline = now;
        league.Description = "[PRIJAVE ZATVORENE] " + (league.Description ?? "");

        await _context.SaveChangesAsync();

        return Ok("Prijave za ligu su uspešno ručno zaključane.");
    }

    [HttpPost("{leagueId}/finish")]
    [Authorize]
    public async Task<IActionResult> FinishLeague(int leagueId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out int currentUserId))
            return Unauthorized("Niste autorizovani.");

        var result = await _leagueService.FinishLeague(leagueId, currentUserId);

        if (result.Contains("Nemate ovlašćenje"))
            return StatusCode(403, result);

        if (result != "OK")
            return BadRequest(result);

        return Ok(new { Message = "Liga je uspešno proglašena završenom. Svi rezultati su arhivirani." });
    }
}