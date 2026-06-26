using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Server.Models;

public class LeagueService : ILeagueService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAdminLogService _adminLogService;

    public LeagueService(AppDbContext context, INotificationService notificationService, IAdminLogService adminLogService)
    {
        _context = context;
        _notificationService = notificationService;
        _adminLogService = adminLogService;
    }

    public async Task<string> GenerateBracket(int leagueId, int currentUserId)
    {
        var league = await _context.Leagues
    .Include(l => l.Creator)
    .Include(l => l.Teams)
        .ThenInclude(t => t.TeamMembers)
            .ThenInclude(tm => tm.User)
    .Include(l => l.Matches)
    .FirstOrDefaultAsync(l => l.Id == leagueId);

        if (league == null)
            return "Liga nije pronađena.";

        var currentUser = await _context.Users.FindAsync(currentUserId);
        if (league.Creator != null && league.Creator.Id != currentUserId && currentUser?.GlobalRole != UserRole.Admin)
        {
            return "Nemate ovlašćenje za generisanje rasporeda ove lige. Samo organizator lige može izvršiti ovu akciju.";
        }

        if (league.Matches.Any())
            return "Liga je već generisana.";

        var teams = league.Teams.ToList();

        if (teams.Count < 2)
            return "Nedovoljno timova za generisanje takmičenja.";

        var random = new Random();
        teams = teams.OrderBy(t => random.Next()).ToList();

        var matches = new List<Match>();

        // 5x5
        if (league.MatchType == Server.Enums.MatchType.Classic_5x5)
        {
            if (teams.Count % 2 != 0)
            {
                teams.Add(null!);
            }

            int numTeams = teams.Count;
            int totalRounds = numTeams - 1;
            int matchesPerRound = numTeams / 2;

            DateTime currentRoundStartDate = league.StartDate;

            for (int round = 1; round <= totalRounds; round++)
            {
                for (int matchNum = 1; matchNum <= matchesPerRound; matchNum++)
                {
                    int homeIdx = (round + matchNum - 2) % (numTeams - 1);
                    int awayIdx = (numTeams - 1 - matchNum + round) % (numTeams - 1);

                    if (matchNum == 1)
                    {
                        awayIdx = numTeams - 1;
                    }

                    var homeTeam = teams[homeIdx];
                    var awayTeam = teams[awayIdx];

                    if (homeTeam == null || awayTeam == null)
                        continue;

                    matches.Add(new Match
                    {
                        League = league,
                        RoundNumber = round,
                        MatchNumber = matchNum,
                        HomeTeam = homeTeam,
                        AwayTeam = awayTeam,
                        Status = MatchStatus.Scheduled,
                        StartTime = currentRoundStartDate,
                        UserStats = new List<UserMatchStats>()
                    });
                }

                currentRoundStartDate = currentRoundStartDate.AddDays(7);
            }
        }
        // 3x3
        else if (league.MatchType == Server.Enums.MatchType.Basket_3X3)
        {
            int bracketSize = 1;
            while (bracketSize < teams.Count)
                bracketSize *= 2;

            int totalRounds = (int)Math.Log2(bracketSize);

            DateTime nextMatchTime = league.StartDate;

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
                        StartTime = nextMatchTime,
                        UserStats = new List<UserMatchStats>()
                    });

                    nextMatchTime = nextMatchTime.AddMinutes(20);
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
                    var nextMatch = matches.FirstOrDefault(m => m.RoundNumber == 2 && m.MatchNumber == nextMatchNum);

                    if (nextMatch != null)
                    {
                        if (matchNum % 2 != 0)
                            nextMatch.HomeTeam = match.HomeTeam;
                        else
                            nextMatch.AwayTeam = match.HomeTeam;
                    }

                    match.Status = MatchStatus.Finished;
                }
            }
        }

        if (league.MatchType == Server.Enums.MatchType.Classic_5x5)
        {
            _context.Matches.AddRange(matches);
        }

        league.LeagueStatus = LeagueStatus.Live;

        await _context.SaveChangesAsync();

        var adminUsername = currentUser?.Username ?? "Sistem";
        await _adminLogService.LogAsync("Liga je počela", $"Liga '{league.Name}' je pokrenuta sa {teams.Count} timova ({league.MatchType}).", adminUsername);

        var userIds = league.Teams
            .SelectMany(t => t.TeamMembers)
            .Where(tm => tm.Active)
            .Select(tm => tm.User.Id)
            .Distinct()
            .ToList();

        await _notificationService.SendNotificationToMultipleUsersAsync(
            userIds,
            "Liga je počela",
            $"Liga {league.Name} je zvanično počela! Raspored mečeva je dostupan.",
            NotificationType.LeagueStarted,
            relatedTeamId: null
        );

        return $"Takmičenje generisano u formatu {league.MatchType}. Ukupno mečeva: {matches.Count(m => m.Status != MatchStatus.Finished || m.AwayTeam != null)}";
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
    public async Task<string> AssignOfficials(int matchId, AssignOfficialsDto dto, int currentUserId)
    {
        var match = await _context.Matches
            .Include(m => m.League)
                .ThenInclude(l => l!.Creator)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null)
            return "Utakmica nije pronađena.";

        var currentUser = await _context.Users.FindAsync(currentUserId);
        if (match.League?.Creator != null && match.League.Creator.Id != currentUserId && currentUser?.GlobalRole != UserRole.Admin)
        {
            return "Nemate ovlašćenje. Samo organizator ove lige može delegirati službena lica.";
        }

        if (dto.RefereeId.HasValue)
        {
            var referee = await _context.Users.FindAsync(dto.RefereeId.Value);

            if (referee == null)
                return $"Referee ne postoji.";

            if (referee.GlobalRole != UserRole.Referee && referee.GlobalRole != UserRole.Admin)
                return "User nema ulogu sudije.";

            match.Referee = referee;

            await _notificationService.SendNotificationAsync(
                referee.Id,
                "Dodeljeni ste kao sudija",
                $"Dodeljeni ste kao sudija za meč {match.HomeTeam?.Name} vs {match.AwayTeam?.Name}",
                NotificationType.OfficialAssigned,
                true,
                relatedMatchId: match.Id
            );
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

            await _notificationService.SendNotificationAsync(
                scorer.Id,
                "Dodeljeni ste kao zapisničar",
                $"Dodeljeni ste kao zapisničar za meč {match.HomeTeam?.Name} vs {match.AwayTeam?.Name}",
                NotificationType.OfficialAssigned,
                true,
                relatedMatchId: match.Id
            );
        }
        else
        {
            match.Scorer = null;
        }

        await _context.SaveChangesAsync();

        return "OK";
    }
    public async Task<PagedResultDto<object>> GetActiveLeaguesAsync(LeagueFilterDto filter)
    {
        var now = DateTime.UtcNow;

        var query = _context.Leagues.Include(l => l.Teams).AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.StatusFilter))
        {
            if (Enum.TryParse<LeagueStatus>(filter.StatusFilter, true, out var parsedStatus))
            {
                query = query.Where(l => l.LeagueStatus == parsedStatus);
            }
        }
        else
        {
            query = query.Where(l => l.LeagueStatus != LeagueStatus.Finished);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            query = query.Where(l => l.Name.ToLower().Contains(filter.SearchTerm.ToLower()));
        }

        if (filter.MatchType.HasValue)
        {
            query = query.Where(l => l.MatchType == filter.MatchType.Value);
        }

        int totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.Id)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(l => new
            {
                l.Id,
                l.Name,
                l.Season,
                l.MatchType,
                l.LeagueStatus,
                l.RegistrationDeadline,
                l.Description,
                l.MaxTeams,
                CurrentTeamsCount = l.Teams.Count,
                l.EntryFee,
                l.StartDate,
                Phase = l.RegistrationDeadline > now ? "Registration Open" : "In Progress"
            })
            .ToListAsync();

        return new PagedResultDto<object>
        {
            Items = items.Cast<object>().ToList(),
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<string> FinishLeague(int leagueId, int currentUserId)
    {
        var league = await _context.Leagues
            .Include(l => l.Creator)
            .Include(l => l.Matches)
            .Include(l => l.Teams)
                .ThenInclude(t => t.TeamMembers)
            .FirstOrDefaultAsync(l => l.Id == leagueId);

        if (league == null)
            return "Liga nije pronađena.";

        var currentUser = await _context.Users.FindAsync(currentUserId);
        if (league.Creator != null && league.Creator.Id != currentUserId && currentUser?.GlobalRole != UserRole.Admin)
        {
            return "Nemate ovlašćenje. Samo organizator lige ili administrator mogu proglasiti ligu završenom.";
        }

        if (!league.Matches.Any())
            return "Liga ne može biti završena jer raspored mečeva nije ni generisan.";

        bool allMatchesFinished = league.Matches.All(m => m.Status == MatchStatus.Finished);
        if (!allMatchesFinished)
        {
            int activeMatchesCount = league.Matches.Count(m => m.Status != MatchStatus.Finished);
            return $"Liga ne može biti završena jer postoji još {activeMatchesCount} mečeva koji nisu odigrani ili završeni.";
        }

        if (league.LeagueStatus == LeagueStatus.Finished)
            return "Liga je već u statusu završene.";

        foreach (var team in league.Teams)
        {
            team.Active = false;
            foreach (var member in team.TeamMembers)
            {
                member.Active = false;
            }
        }

        league.LeagueStatus = LeagueStatus.Finished;
        await _context.SaveChangesAsync();

        var adminUsername = currentUser?.Username ?? "Sistem";
        await _adminLogService.LogAsync("Liga završena", $"Liga '{league.Name}' je završena. Svi timovi su deaktivirani.", adminUsername);

        return "OK";
    }

    public async Task<string> DeleteLeagueAsync(int leagueId, string currentUserId)
    {
        if (!int.TryParse(currentUserId, out int currentUserIdInt))
        {
            return "Nevalidan ID korisnika.";
        }

        var league = await _context.Leagues
            .Include(l => l.Creator)
            .Include(l => l.Matches)
            .Include(l => l.Teams)
                .ThenInclude(t => t.TeamMembers)
            .FirstOrDefaultAsync(l => l.Id == leagueId);

        if (league == null)
            return "Liga nije pronađena.";

        var currentUser = await _context.Users.FindAsync(currentUserIdInt);
        if (league.Creator != null && league.Creator.Id != currentUserIdInt && currentUser?.GlobalRole != UserRole.Admin)
        {
            return "Nemate ovlašćenje za brisanje ove lige.";
        }

        if (league.LeagueStatus != LeagueStatus.Registration || league.Matches.Any())
        {
            return "Nije moguće obrisati ligu koja je već počela.";
        }

        if (league.Teams != null && league.Teams.Any())
        {
            var teamIds = league.Teams.Select(t => t.Id).ToList();

            var invitesToRemove = await _context.TeamInvites
                .Where(ti => teamIds.Contains(ti.Team!.Id))
                .ToListAsync();

            if (invitesToRemove.Any())
            {
                _context.TeamInvites.RemoveRange(invitesToRemove);
            }

            var membersToRemove = league.Teams.SelectMany(t => t.TeamMembers).ToList();
            if (membersToRemove.Any())
            {
                _context.TeamMembers.RemoveRange(membersToRemove);
            }

            _context.Teams.RemoveRange(league.Teams);
        }

        _context.Leagues.Remove(league);

        await _context.SaveChangesAsync();

        var adminUsername = currentUser?.Username ?? "Sistem";
        await _adminLogService.LogAsync("Liga obrisana", $"Liga '{league.Name}' i svi njeni podaci su uspešno obrisani.", adminUsername);

        return "Uspešno";
    }
}