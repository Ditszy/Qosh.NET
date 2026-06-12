using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Constants;
using Server.DTOs;
using Server.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchController : ControllerBase
{
    private readonly IMatchService _matchService;

    public MatchController(IMatchService matchService)
    {
        _matchService = matchService;
    }

    [HttpPost("Start-Match/{id}")]
    [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Scorer)]
    public async Task<IActionResult> StartMatch(int id)
    {
        int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        string userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var result = await _matchService.StartMatchAsync(id, userId, userRole);

        if (result != "OK")
            return BadRequest(result);

        return Ok("Utakmica je uspesno pocela");
    }

    [HttpPost("Pause-Match/{id}")]
    [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Scorer)]
    public async Task<IActionResult> PauseMatch(int id)
    {
        int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        string userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var result = await _matchService.PauseMatchAsync(id, userId, userRole);

        if (result != "OK")
            return BadRequest(result);

        return Ok("Utakmica je privremeno pauzirana.");
    }

    [HttpPost("End-Match/{id}")]
    [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Scorer)]
    public async Task<IActionResult> EndMatch(int id)
    {
        int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        string userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var result = await _matchService.EndMatchAsync(id, userId, userRole);

        if (result != "OK")
            return BadRequest(result);

        return Ok("Utakmica je uspesno zavrsena");
    }

    [HttpPost("Submit-Report/{id}")]
    [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Referee)]
    public async Task<IActionResult> SubmitRefereeReport(int id, [FromBody] RefereeReportDto dto)
    {
        int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        string userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var result = await _matchService.SubmitRefereeReportAsync(id, dto, userId, userRole);

        if (result != "OK")
            return BadRequest(result);

        return Ok("Izvestaj sudije je uspesno podnesen.");
    }

    [HttpPost("Assign-MVP/{id}/{userId}")]
    [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Referee)]
    public async Task<IActionResult> AssignMVPOfMatch(int id, int userId)
    {
        int requestUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        string requestUserRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var result = await _matchService.AssignMVPOfMatchAsync(id, userId, requestUserId, requestUserRole);

        if (result != "OK")
            return BadRequest(result);

        return Ok("MVP utakmice je uspesno dodeljen.");
    }

    [HttpGet("Match-Details/{matchId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMatchDetails(int matchId)
    {

        var match = await _matchService.GetMatchDetailsAsync(matchId);
        if (match == null)
            return NotFound("Mec nije pronadjen");

        return Ok(match);
    }

    [HttpGet("Match-BoxScore/{matchId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMatchBoxScore(int matchId)
    {
        var boxScore = await _matchService.GetMatchBoxScoreAsync(matchId);
        return Ok(boxScore);
    }

    [HttpGet("Get-My-Assigned-Matches")]
    [Authorize(Roles = UserRoles.Scorer + "," + UserRoles.Referee + "," + UserRoles.Admin)]
    public async Task<IActionResult> GetMyAssignedMatches()
    {
        int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        string userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var matches = await _matchService.GetAssignedMatchesAsync(userId, userRole);
        return Ok(matches);
    }

    [HttpPut("Update-Match")]
    [Authorize(Roles = UserRoles.Organizer + "," + UserRoles.Admin)]
    public async Task<IActionResult> UpdateMatch([FromBody] UpdateMatchDto dto)
    {
        int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        string userRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var result = await _matchService.UpdateMatchAsync(dto, userId, userRole);

        if (result != "OK")
            return BadRequest(result);

        return Ok("Utakmica je uspešno ažurirana.");
    }
}