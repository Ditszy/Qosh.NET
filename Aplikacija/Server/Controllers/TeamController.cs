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

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;
    private readonly AppDbContext _context;

    public TeamController(ITeamService teamService, AppDbContext context)
    {
        _teamService = teamService;
        _context = context;
    }
    [Authorize(Roles = UserRoles.Player)]
    [HttpPost("Create-Team")]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _teamService.CreateTeamAsync(dto, userId);

            if (result == "OK")
                return Ok("Uspešno je napravljen tim.");

            return BadRequest(result);
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
            var roster = await _teamService.GetTeamRosterAsync(id);

            if (roster == null)
                return NotFound("Tim nije pronađen ili je ugašen.");

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
            var result = await _teamService.CheckTeamEligibilityAsync(teamId, leagueId);

            if (result == "OK")
                return Ok("Tim ispunjava uslove za prijavu.");

            return BadRequest(result);
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
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _teamService.DisbandTeamAsync(teamId, userId);

            if (result == "OK") return Ok("Uspešno uklonjen tim");
            if (result == "FORBID") return Forbid();

            return BadRequest(result);
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
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _teamService.RemovePlayerFromRosterAsync(teamId, userId, currentUserId);

            if (result == "OK") return Ok("Igrač je uspešno uklonjen iz rostera.");
            if (result == "FORBID") return Forbid();

            return BadRequest(result);
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
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _teamService.TransferCaptaincyAsync(teamId, currentUserId, newCaptainId);

            if (result == "OK") return Ok("Kapitenska traka je uspešno prenesena.");
            if (result == "FORBID") return Forbid();

            return BadRequest(result);
        }
        catch (Exception e)
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