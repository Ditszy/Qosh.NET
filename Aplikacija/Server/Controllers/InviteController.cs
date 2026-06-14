using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Constants;
using Server.Data;
using Server.DTOs;
using Server.Interfaces;

namespace Server.Controllers;

[ApiController]
[Authorize(Roles = UserRoles.Player)]
[Route("api/[controller]")]
public class InviteController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IInviteService _inviteService;

    public InviteController(AppDbContext context, IInviteService inviteService)
    {
        _context = context;
        _inviteService = inviteService;
    }
    [HttpPost("Send-Invite")]
    public async Task<IActionResult> SendInvite([FromBody] SendInviteDto dto)
    {
        try
        {
            var captainId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _inviteService.SendInviteAsync(dto, captainId);

            if (result == "OK")
                return Ok("Pozivnica je uspešno poslata.");


            return BadRequest(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }


    }
    [HttpGet("Get-My-Invites")]
    public async Task<IActionResult> GetMyInvites()
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var invites = await _inviteService.GetMyInvitesAsync(userId);

            return Ok(invites);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPost("Respond-To-Invite")]
    public async Task<IActionResult> RespondToInvite(int inviteId, bool accept)
    {
        try
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _inviteService.RespondToInviteAsync(userId, inviteId, accept);

            if (result == "OK")
                return Ok("Uspešno obrađeno.");

            return BadRequest(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpDelete("Cancel-Invite")]
    public async Task<IActionResult> CancelInvite(int inviteId)
    {
        try
        {
            var captainId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _inviteService.CancelInviteAsync(inviteId, captainId);

            if (result == "OK")
                return Ok("Pozivnica je uspešno obrisana.");


            return BadRequest(result);

        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpGet("Get-Available-Players")]
    public async Task<IActionResult> GetAvailablePlayers(int leagueId)
    {
        try
        {   
            var players = await _inviteService.GetAvailablePlayersAsync(leagueId);
            return Ok(players);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
        
    }
    [HttpGet("Get-Sent-Invites")]
    public async Task<IActionResult> GetSentInvites()
    {
        try
        {
            var captainId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var invites = await _inviteService.GetSentInvitesAsync(captainId);
            
            return Ok(invites);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
}