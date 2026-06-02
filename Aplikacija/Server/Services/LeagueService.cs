using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Server.Models;

public class LeagueService : ILeagueService
{
    private readonly AppDbContext _context;

    public LeagueService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateBracket(int leagueId)
    {
        var league = await _context.Leagues
            .Include(l => l.Teams)
            .Include(l => l.Matches)
            .Include(l => l.Creator)
            .FirstOrDefaultAsync(l => l.Id == leagueId);

        if (league == null)
            return "Liga nije pronađena.";

        if (league.Matches.Any())
            return "Liga je već generisana.";

        var teams = league.Teams.ToList();

        if (teams.Count < 2)
            return "Nedovoljno timova.";

        var random = new Random();
        teams = teams.OrderBy(t => random.Next()).ToList();

        int bracketSize = 1;
        while (bracketSize < teams.Count)
            bracketSize *= 2;

        int totalRounds = (int)Math.Log2(bracketSize);

        var matches = new List<Match>();

        for (int round = 1; round <= totalRounds; round++)
        {
            int matchesInRound = bracketSize / (int)Math.Pow(2, round);

            for (int matchNum = 1; matchNum <= matchesInRound; matchNum++)
            {
                matches.Add(new Match
                {
                    League = league,
                    RoundNumber = round,
                    MatchNumber = matchNum,
                    Status = MatchStatus.Scheduled,
                    StartTime = DateTime.UtcNow.AddDays(round * 2),
                    UserStats = new List<UserMatchStats>()
                });
            }
        }

        _context.Matches.AddRange(matches);

        int currentIndex = 0;
        int firstRoundMatches = bracketSize / 2;
        int byes = bracketSize - teams.Count;

        for (int matchNum = 1; matchNum <= firstRoundMatches; matchNum++)
        {
            var match = matches.First(m => m.RoundNumber == 1 && m.MatchNumber == matchNum);

            int teamCountInMatch = (matchNum <= byes) ? 1 : 2;

            if (currentIndex < teams.Count)
                match.HomeTeam = teams[currentIndex++];

            if (teamCountInMatch == 2 && currentIndex < teams.Count)
                match.AwayTeam = teams[currentIndex++];
            else if (teamCountInMatch == 1)
            {
                int nextMatchNum = (matchNum + 1) / 2;

                var nextMatch = matches.FirstOrDefault(m =>
                    m.RoundNumber == 2 && m.MatchNumber == nextMatchNum);

                if (nextMatch != null)
                {
                    nextMatch.HomeTeam = match.HomeTeam;
                }

                match.Status = MatchStatus.Finished;
            }
        }

        await _context.SaveChangesAsync();

        return $"Kostur generisan ({matches.Count} mečeva)";
    }
    public async Task<Dictionary<int, List<BracketMatchDto>>> GetBracket(int leagueId)
{
    var matches = await _context.Matches
        .Include(m => m.HomeTeam)
        .Include(m => m.AwayTeam)
        .Where(m => m.League != null && m.League.Id == leagueId)
        .ToListAsync();

    if (!matches.Any())
        return new Dictionary<int, List<BracketMatchDto>>();

    var bracket = new Dictionary<int, List<BracketMatchDto>>();

    foreach (var match in matches)
    {
        int roundNumber = match.RoundNumber;

        var dto = new BracketMatchDto
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
            bracket[roundNumber] = new List<BracketMatchDto>();

        bracket[roundNumber].Add(dto);
    }

    foreach (var round in bracket.Keys)
    {
        bracket[round] = bracket[round]
            .OrderBy(m => m.MatchNumber)
            .ToList();
    }

    return bracket;
}
    public async Task<string> AssignOfficials(int matchId, AssignOfficialsDto dto)
{
    var match = await _context.Matches
        .Include(m => m.League)
            .ThenInclude(l => l!.Creator)
        .FirstOrDefaultAsync(m => m.Id == matchId);

    if (match == null)
        return "Utakmica nije pronađena.";

    if (dto.RefereeId.HasValue)
    {
        var referee = await _context.Users.FindAsync(dto.RefereeId.Value);

        if (referee == null)
            return $"Referee ne postoji.";

        if (referee.GlobalRole != UserRole.Referee && referee.GlobalRole != UserRole.Admin)
            return "User nema ulogu sudije.";

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
            return $"Scorer ne postoji.";

        if (scorer.GlobalRole != UserRole.Scorer && scorer.GlobalRole != UserRole.Admin)
            return "User nema ulogu zapisničara.";

        match.Scorer = scorer;
    }
    else
    {
        match.Scorer = null;
    }

    await _context.SaveChangesAsync();

    return "OK";
}
}