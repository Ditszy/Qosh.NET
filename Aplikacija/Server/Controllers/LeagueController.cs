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
[Authorize]
public class LeaguesController : ControllerBase
{
    private readonly AppDbContext _context;

    public LeaguesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("Create-League")]
    [Authorize(Roles =UserRoles.Organizer)]
    public async Task<IActionResult> CreateLeague([FromBody] CreateLeagueDto dto)
    {

        int creatorId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
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
        
        return CreatedAtAction(nameof(GetLeagueById), new { id = newLeague.Id }, newLeague);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
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
        var league = await _context.Leagues
            .Include(l => l.Teams)
            .Include(l => l.Matches)
            .Include(l => l.Creator)
            .FirstOrDefaultAsync(l => l.Id == leagueId);

        if (league == null) return NotFound("Liga nije pronađena.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(userIdClaim);
        bool isCreator = league.Creator?.Id == currentUserId;
        bool isAdmin = User.IsInRole(UserRole.Admin.ToString());

        if (!isCreator && !isAdmin)
        {
            return Forbid("Samo organizator ove lige ili administrator mogu generisati kostur.");
        }

        if (league.Matches.Any()) return BadRequest("Liga je već generisana.");

        var teams = league.Teams.ToList();
        int teamCount = teams.Count;

        if (teamCount < 2) return BadRequest("Potrebna su bar 2 tima za generisanje.");

        var random = new Random();
        teams = teams.OrderBy(t => random.Next()).ToList();

        int bracketSize = 1;
        while (bracketSize < teamCount)
        {
            bracketSize *= 2;
        }

        int totalRounds = (int)Math.Log2(bracketSize);
        var generatedMatches = new List<Match>();

        for (int round = 1; round <= totalRounds; round++)
        {
            int matchesInRound = bracketSize / (int)Math.Pow(2, round);

            for (int matchNum = 1; matchNum <= matchesInRound; matchNum++)
            {
                var match = new Match
                {
                    League = league,
                    Status = MatchStatus.Scheduled,
                    StartTime = DateTime.UtcNow.AddDays(round * 2),
                    RoundNumber = round,
                    MatchNumber = matchNum,
                    Location = null,
                    UserStats = new List<UserMatchStats>()
                };

                generatedMatches.Add(match);
            }
        }

        _context.Matches.AddRange(generatedMatches);

        int currentTeamIndex = 0;
        int firstRoundMatchCount = bracketSize / 2;
        int byesCount = bracketSize - teamCount;

        for (int matchNum = 1; matchNum <= firstRoundMatchCount; matchNum++)
        {
            var currentMatch = generatedMatches.First(m => m.RoundNumber == 1 && m.MatchNumber == matchNum);
            int teamsInThisMatch = (matchNum <= byesCount) ? 1 : 2;

            if (currentTeamIndex < teamCount)
            {
                currentMatch.HomeTeam = teams[currentTeamIndex++];
            }

            if (teamsInThisMatch == 2 && currentTeamIndex < teamCount)
            {
                currentMatch.AwayTeam = teams[currentTeamIndex++];
            }
            else if (teamsInThisMatch == 1)
            {
                int nextMatchNum = (matchNum + 1) / 2;
                var nextMatch = generatedMatches.FirstOrDefault(m => m.RoundNumber == 2 && m.MatchNumber == nextMatchNum);

                if (nextMatch != null)
                {
                    if (matchNum % 2 != 0)
                        nextMatch.HomeTeam = currentMatch.HomeTeam;
                    else
                        nextMatch.AwayTeam = currentMatch.HomeTeam;
                }

                currentMatch.Status = MatchStatus.Finished;
                currentMatch.HomeScore = 1;
                currentMatch.AwayScore = 0;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Kostur uspešno generisan. Kreirano je {generatedMatches.Count} mečeva." });
    }

    [HttpGet("Get-Bracket/{leagueId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBracket(int leagueId)
    {
        var matches = await _context.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Where(m => m.League != null && m.League.Id == leagueId)
            .ToListAsync();

        if (!matches.Any())
        {
            return NotFound("Liga nije generisana ili ne postoji.");
        }

        var bracket = new Dictionary<int, List<BracketMatchDto>>();

        foreach (var match in matches)
        {
            int roundNumber = match.RoundNumber; 

            var matchDto = new BracketMatchDto
            {
                MatchId = match.Id,
                MatchNumber = match.MatchNumber,
                HomeTeamName = match.HomeTeam?.Name ?? "TBD",
                AwayTeamName = match.AwayTeam?.Name ?? "TBD",
                HomeScore = match.HomeScore,
                AwayScore = match.AwayScore,
                Status = match.Status.ToString(),
                StartTime = match.StartTime
            };

            if (!bracket.ContainsKey(roundNumber))
            {
                bracket[roundNumber] = new List<BracketMatchDto>();
            }

            bracket[roundNumber].Add(matchDto);
        }

        foreach (var round in bracket.Keys)
        {
            bracket[round] = bracket[round].OrderBy(m => m.MatchNumber).ToList();
        }

        return Ok(bracket);
    }

    [HttpPost("Assign-Officials")]
    public async Task<IActionResult> AssignMatchOfficials([FromBody] AssignOfficialsDto dto)
    {
        var match = await _context.Matches
            .Include(m => m.League)
                .ThenInclude(l => l!.Creator)
            .FirstOrDefaultAsync(m => m.Id == dto.MatchId);

        if (match == null)
        {
            return NotFound("Utakmica nije pronađena.");
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(userIdClaim);
        bool isCreator = match.League?.Creator?.Id == currentUserId;
        bool isAdmin = User.IsInRole(UserRole.Admin.ToString());

        if (!isCreator && !isAdmin)
        {
            return Forbid("Samo organizator ove lige ili administrator mogu delegirati službena lica.");
        }

        if (dto.RefereeId.HasValue)
        {
            var referee = await _context.Users.FindAsync(dto.RefereeId.Value);
            if (referee == null)
            {
                return NotFound($"Korisnik sa ID-jem {dto.RefereeId} ne postoji.");
            }

            if (referee.GlobalRole != UserRole.Referee && referee.GlobalRole != UserRole.Admin)
            {
                return BadRequest($"Korisnik {referee.Username} nema licencu/ulogu sudije.");
            }

            match.Referee = referee;
        }
        else
        {
            match.Referee = null;
        }

        if (dto.ScorerId.HasValue)
        {
            var scorer = await _context.Users.FindAsync(dto.ScorerId.Value);
            if (scorer == null)
            {
                return NotFound($"Korisnik sa ID-jem {dto.ScorerId} ne postoji.");
            }

            if (scorer.GlobalRole != UserRole.Scorer && scorer.GlobalRole != UserRole.Admin)
            {
                return BadRequest($"Korisnik {scorer.Username} nema ulogu zapisničara.");
            }

            match.Scorer = scorer;
        }
        else
        {
            match.Scorer = null;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Službena lica su uspešno delegirana za utakmicu.",
            matchId = match.Id,
            referee = match.Referee?.Username ?? "Nije dodeljen",
            scorer = match.Scorer?.Username ?? "Nije dodeljen"
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

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(userIdClaim);
        bool isCreator = league.Creator?.Id == currentUserId;
        bool isAdmin = User.IsInRole(UserRole.Admin.ToString());

        if (!isCreator && !isAdmin)
        {
            return Forbid("Samo organizator ove lige ili administrator je mogu obrisati.");
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

        return Ok(new { message = $"Liga '{league.Name}' i svi njeni zakazani mečevi su uspešno obrisani." });
    }

    [HttpGet("Get-Active-Leagues")]
    [AllowAnonymous]
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

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(userIdClaim);
        bool isCreator = league.Creator?.Id == currentUserId;
        bool isAdmin = User.IsInRole(UserRole.Admin.ToString());

        if (!isCreator && !isAdmin)
        {
            return Forbid("Samo organizator ove lige ili administrator mogu menjati pravila.");
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

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(userIdClaim);
        bool isCreator = match.League?.Creator?.Id == currentUserId;
        bool isAdmin = User.IsInRole(UserRole.Admin.ToString());

        if (!isCreator && !isAdmin)
        {
            return Forbid("Samo organizator ove lige ili administrator mogu odložiti utakmicu.");
        }

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
        return Ok(new
        {
            message = "Utakmica je uspešno odložena i pomerena na novi termin.",
            matchId = match.Id,
            newStartTime = match.StartTime,
            location = match.Location
        });
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

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(userIdClaim);
        bool isCreator = league.Creator?.Id == currentUserId;
        bool isAdmin = User.IsInRole(UserRole.Admin.ToString());

        if (!isCreator && !isAdmin)
        {
            return Forbid("Samo organizator ove lige ili administrator mogu ručno zatvoriti prijave.");
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

        return Ok(new
        {
            message = "Prijave za ligu su uspešno ručno zaključane.",
            leagueId = league.Id,
            finalTeamsCount = league.Teams.Count,
            maxTeams = league.MaxTeams,
            lockedAt = league.RegistrationDeadline
        });
    }
}