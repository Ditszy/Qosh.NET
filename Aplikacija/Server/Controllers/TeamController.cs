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
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization.Infrastructure;

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
                       (t.City ?? "").ToLower() == (dto.City ?? "").ToLower());
            if (team) 
                return BadRequest($"Tim sa imenom '{dto.Name}' iz grada '{dto.City}' već postoji.");
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
            var roster = await _context.TeamMembers
            .Where(tm => tm.Team.Id == id && tm.Active)
            .Select(tm => new TeamMemberDto
            {
                Username = tm.User.Username,
                DateJoined = tm.DateJoined
            })
            .ToListAsync();
            if (!roster.Any())
            {
                var team = await _context.Teams.AnyAsync(t => t.Id == id);
                if (!team) 
                    return NotFound("Tim nije pronađen.");
                return Ok(new List<TeamMemberDto>());
            }
        
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

            int activeMembers = await _context.TeamMembers
                .CountAsync(tm => tm.Team.Id == teamId && tm.Active);

            bool isEligible = activeMembers >= minRequired;

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
}