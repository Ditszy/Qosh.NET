using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.Admin) + "," + nameof(UserRole.Scorer))]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpPost("Add-Action")]
    public async Task<IActionResult> AddAction([FromBody] AddActionDto dto)
    {
        await _statisticsService.AddActionAsync(dto);
        return Ok();
    }
    
    [HttpGet("Player-Stats/{userId}")]
    public async Task<IActionResult> GetPlayerStats(int userId)
    {
        var result = await _statisticsService.GetPlayerStatsAsync(userId);
        return Ok(result);
    }
    [HttpGet("League-Leaderboard/{leagueId}")]
    public async Task<IActionResult> GetLeagueLeaderboard(int leagueId)
    {
        var result = await _statisticsService.GetLeagueLeaderboardAsync(leagueId);
        return Ok(result);
    }
    [HttpGet("Team-Stats/{leagueId}")]
    public async Task<IActionResult> GetTeamStats(int leagueId)
    {
        var result = await _statisticsService.GetTeamStatsAsync(leagueId);
        return Ok(result);
    }
}