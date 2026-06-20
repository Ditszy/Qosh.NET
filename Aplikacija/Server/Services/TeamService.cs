using Server.DTOs;
using Server.Interfaces;
using Server.Models;
using Server.Data;
using Server.Enums;
using Microsoft.EntityFrameworkCore;

namespace Server.Services;

public class TeamService : ITeamService
{
    private readonly AppDbContext _context;

    public TeamService(AppDbContext context)
    {
        _context = context;
    }
    public async Task<string> CheckTeamEligibilityAsync(int teamId, int leagueId)
    {
        var league = await _context.Leagues.FindAsync(leagueId);
        if (league == null) return "Liga nije pronađena.";

        var team = await _context.Teams.FindAsync(teamId);
        if (team == null) return "Tim nije pronađen.";
        if (!team.Active) return "Prijavljivanje nije moguće: ovaj tim je ugašen (disbanded).";

        int minRequired = league.MatchType == Enums.MatchType.Basket_3X3 ? 3 : 5;
        int activeMembers = await _context.TeamMembers
            .CountAsync(tm => tm.Team.Id == teamId && tm.Active);

        if (activeMembers < minRequired)
            return $"Tim mora imati najmanje {minRequired} igrača za ovu ligu. Trenutno imate {activeMembers}.";

        return "OK";
    }

    public async Task<string> CreateTeamAsync(CreateTeamDto dto, int userId)
    {
        var exists = await _context.Teams.AnyAsync(t =>
        t.Name.ToLower() == dto.Name.ToLower() &&
        (t.City ?? "").ToLower() == (dto.City ?? "").ToLower() &&
        t.League.Id == dto.LeagueId &&
        t.Active == true);

        if (exists)
            return $"Aktivan tim sa imenom '{dto.Name}' već postoji u ovom takmičenju.";


        var league = await _context.Leagues.FindAsync(dto.LeagueId);
        if (league == null)
            return "Navedena liga ne postoji.";

        var isUserAlreadyInLeague = await _context.TeamMembers
        .AnyAsync(tm => tm.User.Id == userId
                     && tm.Team.League.Id == dto.LeagueId
                     && tm.Active == true);

        if (isUserAlreadyInLeague)
            return "Već ste član tima u ovoj ligi i ne možete kreirati novi.";
        string temp = dto.Name.Replace(" ", string.Empty);
        var newTeam = new Team
        {
            Name = dto.Name,
            City = dto.City,
            League = league,
            LogoUrl = "https://api.dicebear.com/7.x/identicon/svg?seed=" + temp
        };
        _context.Teams.Add(newTeam);

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return "Korisnik ne postoji u bazi!";

        var captain = new TeamMember
        {
            User = user,
            Team = newTeam,
            DateJoined = DateTime.UtcNow,
            Active = true,
            RoleInTeam = UserRole.Captain
        };

        _context.TeamMembers.Add(captain);
        await _context.SaveChangesAsync();

        return "OK";
    }

    public async Task<string> DisbandTeamAsync(int teamId, int currentUserId)
    {
        var isCaptain = await _context.TeamMembers
        .AnyAsync(tm => tm.Team.Id == teamId && tm.User.Id == currentUserId && tm.RoleInTeam == UserRole.Captain && tm.Active);

        if (!isCaptain) return "Korisnik nije kapiten tima";

        var team = await _context.Teams
            .Include(t => t.League)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null) return "Tim nije pronađen.";

        var invites = await _context.TeamInvites
            .Where(i => i.Team != null && i.Team.Id == teamId)
            .ToListAsync();

        if (invites.Any())
        {
            _context.TeamInvites.RemoveRange(invites);
        }

        var members = await _context.TeamMembers
            .Where(tm => tm.Team.Id == teamId)
            .ToListAsync();

        bool isRegistrationClosed = DateTime.UtcNow > team.League.RegistrationDeadline;

        if (isRegistrationClosed)
        {
            team.Active = false;
            foreach (var member in members)
            {
                member.Active = false;
            }
        }
        else
        {
            _context.TeamMembers.RemoveRange(members);
            _context.Teams.Remove(team);
        }

        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<List<TeamMemberDto>?> GetTeamRosterAsync(int teamId)
    {
        var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null || !team.Active)
            return null;

        return await _context.TeamMembers
            .Where(tm => tm.Team.Id == teamId && tm.Active)
            .Select(tm => new TeamMemberDto
            {
                UserId = tm.User.Id,
                Username = tm.User.Username,
                FirstName = tm.User.FirstName,
                LastName = tm.User.LastName,
                JerseyNumber = tm.JerseyNumber,
                DateJoined = tm.DateJoined,
                Role = tm.RoleInTeam.HasValue ? tm.RoleInTeam.Value.ToString() : "Player"
            })
            .ToListAsync();
    }

    public async Task<string> RemovePlayerFromRosterAsync(int teamId, int userId, int currentUserId)
    {
        var isCaptain = await _context.TeamMembers
        .AnyAsync(tm => tm.Team.Id == teamId && tm.User.Id == currentUserId && tm.RoleInTeam == UserRole.Captain && tm.Active);

        if (!isCaptain) return "Korisnik nije kapiten tima";

        var team = await _context.Teams
            .Include(t => t.League)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null) return "Tim nije pronađen.";
        if (!team.Active) return "Ovaj tim je ugašen.";

        var member = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.Team.Id == teamId && tm.User.Id == userId && tm.Active);

        if (member == null) return "Igrač nije pronađen u ovom timu ili je već uklonjen.";

        var leagueStarted = team.League != null && DateTime.UtcNow >= team.League.RegistrationDeadline;

        if (!leagueStarted)
        {
            _context.TeamMembers.Remove(member);
        }
        else
        {
            member.Active = false;
        }

        await _context.SaveChangesAsync();

        return "OK";
    }

    public async Task<string> TransferCaptaincyAsync(int teamId, int newCaptainId, int currentUserId)
    {
        var isCaptain = await _context.TeamMembers
        .AnyAsync(tm => tm.Team.Id == teamId && tm.User.Id == currentUserId && tm.RoleInTeam == UserRole.Captain && tm.Active);

        if (!isCaptain) return "Korisnik nije kapiten tima";

        var currentCaptain = await _context.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(tm => tm.Team.Id == teamId && tm.RoleInTeam == UserRole.Captain && tm.Active);

        var newCaptain = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.Team.Id == teamId && tm.User.Id == newCaptainId && tm.Active);

        if (currentCaptain != null && currentCaptain.User.Id == newCaptainId)
            return "Vi ste već kapiten tima.";

        if (newCaptain == null)
            return "Igrač nije pronađen u timu ili nije aktivan.";

        if (currentCaptain != null)
        {
            currentCaptain.RoleInTeam = UserRole.Player;
        }

        newCaptain.RoleInTeam = UserRole.Captain;

        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<string> UploadTeamLogoAsync(int teamId, IFormFile file, int currentUserId)
    {
        var team = await _context.Teams.FindAsync(teamId);
        if (team == null)
            return "Tim nije pronađen.";

        var isCaptain = await _context.TeamMembers
        .AnyAsync(tm => tm.Team.Id == teamId
                     && tm.User.Id == currentUserId
                     && tm.RoleInTeam == UserRole.Captain
                     && tm.Active);

        if (!isCaptain)
            return "Samo kapiten tima može menjati logo.";


        if (!string.IsNullOrEmpty(team.LogoUrl))
        {
            var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", team.LogoUrl.TrimStart('/'));
            if (File.Exists(oldFilePath))
            {
                File.Delete(oldFilePath);
            }
        }
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logos");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        team.LogoUrl = "/logos/" + fileName;
        await _context.SaveChangesAsync();

        return "OK";
    }

    public async Task<string> ChangeJerseyNumberAsync(int teamId, int userId, int jerseyNumber, int currentUserId)
    {
        var isCaptain = await _context.TeamMembers
        .AnyAsync(tm => tm.Team.Id == teamId
                     && tm.User.Id == currentUserId
                     && tm.RoleInTeam == UserRole.Captain
                     && tm.Active);

        if (!isCaptain)
            return "Samo kapiten može menjati broj dresa";

        var teamMember = await _context.TeamMembers
        .FirstOrDefaultAsync(tm => tm.Team.Id == teamId && tm.User.Id == userId);

        if (teamMember == null)
        {
            return "Ovaj korisnik ne postoji";
        }

        var isNumberTaken = await _context.TeamMembers
        .AnyAsync(tm => tm.Team.Id == teamId && tm.JerseyNumber == jerseyNumber && tm.User.Id != userId);

        if (isNumberTaken)
            return "Taj broj dresa je već zauzet u vašem timu";

        teamMember.JerseyNumber = jerseyNumber;
        await _context.SaveChangesAsync();
        return "OK";
    }
}