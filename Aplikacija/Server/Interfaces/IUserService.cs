using Server.DTOs;

namespace Server.Services;

public interface IUserService
{
    Task<UserProfileDto?> GetProfileAsync(int userId);
    Task<string> UpdateProfileAsync(int userId, UpdateProfileDto dto);
    Task<List<NotificationDto>> GetNotificationsAsync(int userId);
    Task<string> MarkNotificationAsReadAsync(int notificationId);
    Task<string> DeleteAccountAsync(int userId);
    Task<string> ChangePasswordAsync(int userId, ChangePasswordDto dto);
    Task<List<UserDto>> SearchUsersAsync(string query);
    Task<List<LeagueDto>> GetOrganizerLeaguesAsync(int organizerId);
    Task<string> SetProfilePictureAsync(int userId, IFormFile file);
}