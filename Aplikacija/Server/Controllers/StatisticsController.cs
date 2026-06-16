using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Constants;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpPost("Add-Action")]
    [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Scorer)]
    public async Task<IActionResult> AddAction([FromBody] AddActionDto dto)
    {
        await _statisticsService.AddActionAsync(dto);
        return Ok();
    }

    [AllowAnonymous]
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int? leagueId)
    {
        try
        {
            var leaderboard = await _statisticsService.GetGlobalLeaderboardAsync(leagueId);
            return Ok(leaderboard);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
}