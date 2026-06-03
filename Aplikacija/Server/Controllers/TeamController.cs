namespace Server.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Server.Constants;
using Server.DTOs;
using Server.Data;
using Server.Interfaces;
using Server.Models;
using Server.Enums;
using Server.Dtos;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TeamController : ControllerBase
{
    private readonly IAuthService _adminService;
    private readonly AppDbContext _context;

    public TeamController(IAuthService adminService, AppDbContext context)
    {
        _adminService = adminService;
        _context = context;
    }
    private async Task<bool> IsUserCaptain(int teamId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdString)) return false;
        
        int currentUserId = int.Parse(userIdString);

        return await _context.TeamMembers
            .AnyAsync(tm => tm.Team.Id == teamId 
                         && tm.User.Id == currentUserId 
                         && tm.RoleInTeam == UserRole.Captain);
    }
    [Authorize(Roles = UserRoles.Player)]
    [HttpPost("Create-Team")]
    public async Task<IActionResult> CreateTeam([FromBody]CreateTeamDto dto)
    {
        try
        {
            var team = await _context.Teams.AnyAsync(t => t.Name.ToLower() == dto.Name.ToLower() && 
                       (t.City ?? "").ToLower() == (dto.City ?? "").ToLower()&& t.Active == true);
            if (team) 
                return BadRequest($"Aktivan tim sa imenom '{dto.Name}' iz grada '{dto.City}' već postoji.");
            var newTeam = new Team 
            { 
                Name = dto.Name,
                City = dto.City
            };
            _context.Teams.Add(newTeam);
            await _context.SaveChangesAsync();
            return Ok($"Uspesno je napravljen tim.");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [AllowAnonymous]
    [HttpGet("Get-Team-Roster/{id}")]
    public async Task<ActionResult<List<TeamMemberDto>>> GetTeamRoster(int id)
    {
        try
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == id);
            if (team == null) 
                return NotFound("Tim nije pronađen.");
            if (!team.Active) 
                return BadRequest("Ovaj tim je ugašen.");
            var roster = await _context.TeamMembers
            .Where(tm => tm.Team.Id == id && tm.Active)
            .Select(tm => new TeamMemberDto
            {
                Username = tm.User.Username,
                DateJoined = tm.DateJoined
            })
            .ToListAsync();
            return Ok(roster);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpGet("Check-Team-Eligibility/{teamId}/for-league/{leagueId}")]
    public async Task<IActionResult> CheckTeamEligibility(int teamId, int leagueId)
    {
        try
        {
            if (!await IsUserCaptain(teamId))
            {
                return Forbid();
            }

            var league = await _context.Leagues.FindAsync(leagueId);
            if (league == null) return NotFound("Liga nije pronađena.");

            int minRequired = league.MatchType == MatchType.Basket_3X3 ? 3 : 5;

            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
                return NotFound("Tim nije pronađen.");
            
            if (!team.Active)
                return BadRequest("Prijavljivanje nije moguće: ovaj tim je ugašen (disbanded).");

            int activeMembers = await _context.TeamMembers
                .CountAsync(tm => tm.Team.Id == teamId && tm.Active);

            if (activeMembers >= minRequired)
            {
                return Ok("Tim ispunjava uslove za prijavu.");
            }
            else
            {
                return BadRequest($"Tim mora imati najmanje {minRequired} igrača za ovu ligu. Trenutno imate {activeMembers}.");
            }
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPatch("Disband-Team/{teamId}")]
    public async Task<IActionResult> DisbandTeam(int teamId)
    {
        try
        {
            if (!await IsUserCaptain(teamId))
            {
                return Forbid();
            }

            var team = await _context.Teams.FindAsync(teamId);
            if (team != null)
            {
                team.Active = false;
            }

            var members = await _context.TeamMembers
                .Where(tm => tm.Team.Id == teamId)
                .ToListAsync();

            foreach (var member in members)
            {
                member.Active = false;
            }

            await _context.SaveChangesAsync();
            return Ok("Uspesno uklonjen tim");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPatch("Remove-Player/{teamId}/{userId}")]
    public async Task<IActionResult> RemovePlayerFromRoster(int teamId, int userId)
    {
        try
        {
            if (!await IsUserCaptain(teamId))
            {
                return Forbid();
            }
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null) 
                return NotFound("Tim nije pronađen.");
            if (!team.Active) 
                return BadRequest("Ovaj tim je ugašen.");
            
            var member = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.Team.Id == teamId && tm.User.Id == userId && tm.Active);

            if (member == null)
                return NotFound("Igrač nije pronađen u ovom timu ili je već uklonjen.");

            member.Active = false;

            await _context.SaveChangesAsync();

            return Ok("Igrač je uspešno uklonjen iz rostera.");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPatch("Transfer-Captaincy/{teamId}/{newCaptainId}")]
    public async Task<IActionResult> TransferCaptaincy(int teamId, int newCaptainId)
    {
        try
        {
            if (!await IsUserCaptain(teamId))
            {
                return Forbid();
            }
        var currentCaptain = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.Team.Id == teamId && tm.RoleInTeam == UserRole.Captain && tm.Active);

        var newCaptain = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.Team.Id == teamId && tm.User.Id == newCaptainId && tm.Active);
        
        if (currentCaptain != null && currentCaptain.Id == newCaptain?.Id)
        {
            return BadRequest("Vi ste već kapiten tima.");
        }

        if (newCaptain == null)
            return NotFound("Igrač nije pronađen u timu ili nije aktivan.");

        if (currentCaptain != null)
        {
            currentCaptain.RoleInTeam = UserRole.Player;
        }
        
        newCaptain.RoleInTeam = UserRole.Captain;

        await _context.SaveChangesAsync();

        return Ok("Kapitenska traka je uspešno prenesena.");
        }
        catch(Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPost("Upload-Team-Logo")]
    public async Task<IActionResult> UploadTeamLogo()
    {
        return Ok("Još uvek nije implementirana");
    }
}