using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Constants;
using Server.Data;
using Server.DTOs;
using Server.Interfaces;

namespace Server.Controllers;

[ApiController]
[Authorize]
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
    [Authorize(Roles = UserRoles.Player)]
    [HttpPost("Send-Invite")]
    public async Task<IActionResult> SendInvite([FromBody] SendInviteDto dto)
    {
        try
        {
            var captainId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _inviteService.SendInviteAsync(dto, captainId);

            if (result == "OK")
                return Ok("Pozivnica je uspešno poslata.");

            if (result == "FORBID")
                return Forbid("Samo kapiten može slati pozivnice.");

            return BadRequest(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }


    }
    [Authorize(Roles = UserRoles.Player)]
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
    [Authorize(Roles = UserRoles.Player)]
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
    public async Task<IActionResult> CancelInvite()
    {
        return null;
    }
    public async Task<IActionResult> GetAvailablePlayers()
    {
        return null;
    }
    public async Task<IActionResult> GetSentInvites()
    {
        return null;
    }
}