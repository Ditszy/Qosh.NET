using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Constants;
using Server.Data;
using Server.Dtos;
using Server.Enums;
using Server.Interfaces;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles =UserRoles.Organizer)]
public class LeaguesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILeagueService _leagueService;

    public LeaguesController(ILeagueService leagueService, AppDbContext context)
    {
        _context = context;
        _leagueService = leagueService;
    }

    [HttpPost("Create-League")]
    public async Task<IActionResult> CreateLeague([FromBody] CreateLeagueDto dto)
    {

        int creatorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var creator= await _context.Users.FindAsync(creatorId);

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
            Creator=creator,
            Matches = new List<Match>(),
            Teams = new List<Team>()
        };

        _context.Leagues.Add(newLeague);
        await _context.SaveChangesAsync();
        
        return Ok($"Liga '{newLeague.Name}' je kreirana.");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLeagueById(int id)
    {
        var league = await _context.Leagues
            .Include(l => l.Creator)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (league == null) return NotFound();

        return Ok(league);
    }

    [HttpPost("Generate-Bracket/{leagueId}")]
public async Task<IActionResult> GenerateBracket(int leagueId)
{
    var result = await _leagueService.GenerateBracket(leagueId);

    if (result.Contains("nije") ||
        result.Contains("Nema") ||
        result.Contains("već"))
        return BadRequest(result);

    return Ok(result);
}

    [HttpGet("Get-Bracket/{leagueId}")]
public async Task<IActionResult> GetBracket(int leagueId)
{
    var result = await _leagueService.GetBracket(leagueId);

    if (result == null)
        return NotFound("Liga nije generisana ili ne postoji.");

    return Ok(result);
}

 [HttpPost("Assign-Officials")]
public async Task<IActionResult> AssignMatchOfficials([FromBody] AssignOfficialsDto dto)
{
//Mozda bolje da bude u match
    var result = await _leagueService.AssignOfficials(dto.MatchId, dto);

    if (result != "OK")
        return BadRequest(result);

    return Ok(new
    {
        message = "Službena lica su uspešno delegirana."
    });
}

    [HttpDelete("Delete-League/{id}")]
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

        return Ok($"Liga '{league.Name}' i svi njeni zakazani mečevi su uspešno obrisani." );
    }

    [HttpGet("Get-Active-Leagues")]
    public async Task<IActionResult> GetActiveLeagues([FromQuery] LeagueFilterDto filter)
    {
        var now = DateTime.UtcNow;

        var query = _context.Leagues
            .Include(l => l.Teams)
            .Where(l => l.RegistrationDeadline > now || l.Matches.Any(m => m.Status != MatchStatus.Finished));

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            query = query.Where(l => l.Name.ToLower().Contains(filter.SearchTerm.ToLower()));
        }

        if (filter.MatchType.HasValue)
        {
            query = query.Where(l => l.MatchType == filter.MatchType.Value);
        }

        if (filter.OnlyRegistrationOpen.HasValue && filter.OnlyRegistrationOpen.Value)
        {
            query = query.Where(l => l.RegistrationDeadline > now && l.Teams.Count < l.MaxTeams);
        }

        var activeLeagues = await query
            .OrderBy(l => l.RegistrationDeadline)
            .Select(l => new
            {
                l.Id,
                l.Name,
                l.Season,
                l.MatchType,
                l.RegistrationDeadline,
                l.Description,
                l.MaxTeams,
                CurrentTeamsCount = l.Teams.Count,
                l.EntryFee,
                Phase = l.RegistrationDeadline > now ? "Registration Open" : "In Progress"
            })
            .ToListAsync();

        return Ok(activeLeagues);
    }

    [HttpPut("Update-Rules/{id}")]
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

        await _context.SaveChangesAsync();
        return Ok(new { message = "Pravila lige su uspešno ažurirana.", league });
    }

    [HttpPut("Postpone")]
    public async Task<IActionResult> PostponeMatch([FromBody] PostponeMatchDto dto)
    {
        if (dto.NewStartTime <= DateTime.UtcNow)
        {
            return BadRequest("Novi termin utakmice mora biti u budućnosti.");
        }

        var match = await _context.Matches
            .Include(m => m.League)
                .ThenInclude(l => l!.Creator)
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

        await _context.SaveChangesAsync();
        return Ok("Utakmica je uspešno odložena i pomerena na novi termin.");
    }

    [HttpPut("Lock-Registrations/{id}")]
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

        league.RegistrationDeadline = now;
        league.Description = "[PRIJAVE ZATVORENE] " + (league.Description ?? "");

        await _context.SaveChangesAsync();

        return Ok("Prijave za ligu su uspešno ručno zaključane.");
    }
}