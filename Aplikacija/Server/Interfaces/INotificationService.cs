using Server.DTOs;
using Server.Enums;

namespace Server.Interfaces;

public interface INotificationService
{
    Task SendNotificationAsync(int userId, string title, string message, NotificationType type, int? relatedMatchId = null, int? relatedTeamId = null);
    Task SendNotificationToMultipleUsersAsync(List<int> userIds, string title, string message, NotificationType type, int? relatedMatchId = null, int? relatedTeamId = null);
}