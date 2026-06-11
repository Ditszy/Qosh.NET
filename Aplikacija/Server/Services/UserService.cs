using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;

namespace Server.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public Task<UserProfileDto?> GetProfileAsync(int userId)
    {
        return _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new UserProfileDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                GlobalRole = u.GlobalRole.HasValue ? u.GlobalRole.Value.ToString() : null,

                Teams = u.TeamMembers.Select(tm => new UserTeamDto
                {
                    TeamId = tm.Team.Id,
                    TeamName = tm.Team.Name,
                    LeagueName = tm.Team.League.Name,
                    RoleInTeam = tm.RoleInTeam.HasValue ? tm.RoleInTeam.Value.ToString() : null,
                    IsActiveInTeam = tm.Active
                }).ToList(),

                MatchHistory = u.MatchStats.Select(ms => new UserMatchHistoryDto
                {
                    MatchId = ms.Match!.Id,
                    HomeTeamName = ms.Match.HomeTeam!.Name,
                    AwayTeamName = ms.Match.AwayTeam!.Name,
                    HomeScore = ms.Match.HomeScore,
                    AwayScore = ms.Match.AwayScore,
                    StartTime = ms.Match.StartTime,
                    MatchStatus = ms.Match.Status.ToString(),
                    Points = ms.Points,
                    Assists = ms.Assists,
                    Rebounds = ms.Rebounds,
                    Fouls = ms.Fouls
                }).ToList()
            })
            .FirstOrDefaultAsync();
    }
    public async Task<string> UpdateProfileAsync(int userId, UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return "Korisnik nije pronađen.";

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.JerseyNumber = dto.JerseyNumber;
        user.ProfilePictureUrl = dto.ProfilePictureUrl;
        user.DateOfBirth = dto.DateOfBirth;

        await _context.SaveChangesAsync();
        return "OK";
    }
    public async Task<List<NotificationDto>> GetNotificationsAsync(int userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type.ToString(),
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                RelatedMatchId = n.RelatedMatchId,
                RelatedTeamId = n.RelatedTeamId
            })
            .ToListAsync();
    }
    public async Task<string> MarkNotificationAsReadAsync(int notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);

        if (notification == null)
            return "Obaveštenje nije pronađeno.";

        notification.IsRead = true;

        await _context.SaveChangesAsync();
        return "OK";
    }
    public async Task<string> DeleteAccountAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return "Korisnik nije pronađen.";

        user.Username = $"deleted_user_{user.Id}";
        user.Email = $"deleted_{user.Id}@qosh.local";
        user.FirstName = "Obrisani";
        user.LastName = "Korisnik";
        user.ProfilePictureUrl = null;
        user.DateOfBirth = null;
        user.JerseyNumber = null;

        user.PasswordHash = Array.Empty<byte>();
        user.PasswordSalt = Array.Empty<byte>();

        user.IsActive = false;

        var activeMemberships = await _context.TeamMembers
            .Where(tm => tm.User.Id == userId && tm.Active)
            .ToListAsync();

        foreach (var membership in activeMemberships)
        {
            membership.Active = false;
        }

        await _context.SaveChangesAsync();
        return "OK";
    }
    public async Task<string> ChangePasswordAsync(int userId, ChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return "Korisnik nije pronađen.";


        using var hmac = new System.Security.Cryptography.HMACSHA512();
        user.PasswordSalt = hmac.Key;
        user.PasswordHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dto.NewPassword));

        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<List<UserDto>> SearchUsersAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<UserDto>();

        return await _context.Users
            .Where(u => u.Username.ToLower().Contains(query.ToLower()) || 
                        (u.FirstName != null && u.FirstName.ToLower().Contains(query.ToLower())) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(query.ToLower())))
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                IsActive = u.IsActive,
                GlobalRole = u.GlobalRole,
                DateOfBirth = u.DateOfBirth.HasValue ? u.DateOfBirth.Value.ToString("yyyy-MM-dd") : null
            })
            .ToListAsync();
    }

    public async Task<List<LeagueDto>> GetOrganizerLeaguesAsync(int organizerId)
    {
        return await _context.Leagues
            .Where(l => l.Creator != null && l.Creator.Id == organizerId)
            .Select(l => new LeagueDto
            {
                Id = l.Id,
                Name = l.Name,
                Season = l.Season,
                MatchType = l.MatchType,
                RegistrationDeadline = l.RegistrationDeadline.ToString("yyyy-MM-dd"),
                MaxTeams = l.MaxTeams,
                EntryFee = l.EntryFee,
                TeamCount = l.Teams.Count
            })
            .ToListAsync();
    }

    public async Task<string> SetProfilePictureAsync(int userId, IFormFile file)
    {
        var user = await _context.Users
        .FindAsync(userId);

        if(user == null)
            return "Korisnik nije pronađen.";
        if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
        {
            var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.ProfilePictureUrl.TrimStart('/'));
            if (File.Exists(oldFilePath))
            {
                File.Delete(oldFilePath);
            }
        }
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "profile_pictures");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.ProfilePictureUrl = "/profile_pictures/" + fileName;
        await _context.SaveChangesAsync();

        return "OK";
    }
}