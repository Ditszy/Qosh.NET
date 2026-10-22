namespace Server.Controllers;

using Microsoft.AspNetCore.Mvc;
using Server.Data;
using Server.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Server.DTOs;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VoteController : ControllerBase
{
    private readonly AppDbContext _context;

    public VoteController(AppDbContext context) => _context = context;

    [HttpPost("Cast-Vote")]
    public async Task<IActionResult> CastVote([FromBody] VoteDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        var match = await _context.Matches.FindAsync(dto.MatchId);
        if (match == null) return NotFound("Utakmica nije pronađena.");

        if (match.Status != Enums.MatchStatus.Scheduled) 
            return BadRequest("Glasanje je zatvoreno jer je utakmica počela.");

        var vote = new Vote
        {
            MatchId = dto.MatchId,
            UserId = int.Parse(userIdClaim),
            TeamId = dto.TeamId
        };
        try {
            _context.Votes.Add(vote);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Glas uspešno zabeležen!" });
        } 
        catch (DbUpdateException) {
            return BadRequest("Već ste glasali za ovu utakmicu.");
        }
    }
    [HttpGet("Get-Votes/{matchId}")]
    public async Task<IActionResult> GetVotes(int matchId)
    {
        var stats = await _context.Votes
            .Where(v => v.MatchId == matchId)
            .GroupBy(v => v.TeamId)
            .Select(g => new { TeamId = g.Key, Count = g.Count() })
            .ToListAsync();

        return Ok(stats);
    }
    [HttpGet("Has-Voted/{matchId}")]
    public async Task<IActionResult> HasVoted(int matchId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (int.TryParse(userIdString, out int userIdInt))
        {
            var alreadyVoted = await _context.Votes
                .AnyAsync(v => v.MatchId == matchId && v.UserId == userIdInt);
                
            return Ok(alreadyVoted);
        }
        
        return BadRequest("Invalid User ID format");
    }
}