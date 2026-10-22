using Microsoft.AspNetCore.SignalR;
using Hubs;
using Server.Data;
using Server.Enums;
using Server.Interfaces;
using Server.Models;

namespace Server.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IEmailService _emailService;

    public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext, IEmailService emailService)
    {
        _context = context;
        _hubContext = hubContext;
        _emailService = emailService;
    }

    public async Task SendNotificationAsync(int userId, string title, string message, NotificationType type, bool sendEmail = false, int? relatedMatchId = null, int? relatedTeamId = null)
    {
        var user = await _context.Users.FindAsync(userId);
        string? userEmail = sendEmail ? user?.Email : null;
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedMatchId = relatedMatchId,
            RelatedTeamId = relatedTeamId,
            CreatedAt = DateTime.UtcNow,
            IsRead = false,
            IsEmail = sendEmail,
            EmailStatus = sendEmail ? "Pending" : "None",
            RecipientEmail = userEmail
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", new
        {
            notification.Id,
            notification.Title,
            notification.Message,
            Type = notification.Type.ToString(),
            notification.RelatedMatchId,
            notification.RelatedTeamId,
            notification.CreatedAt,
            notification.IsRead
        });
        if (sendEmail && user != null && !string.IsNullOrEmpty(user.Email))
    {
        try 
        {
            await _emailService.SendEmailAsync(user.Email, title, message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Greska pri slanju emaila: {ex.Message}");
        }
    }
    }

    public async Task SendNotificationToMultipleUsersAsync(List<int> userIds, string title, string message, NotificationType type, int? relatedMatchId = null, int? relatedTeamId = null)
    {
        var notifications = userIds.Select(userId => new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedMatchId = relatedMatchId,
            RelatedTeamId = relatedTeamId,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        }).ToList();

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        foreach (var notification in notifications)
        {
            await _hubContext.Clients.Group($"User_{notification.UserId}").SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Title,
                notification.Message,
                Type = notification.Type.ToString(),
                notification.RelatedMatchId,
                notification.RelatedTeamId,
                notification.CreatedAt,
                notification.IsRead
            });
        }
    }
}