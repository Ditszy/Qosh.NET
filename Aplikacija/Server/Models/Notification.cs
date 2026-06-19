using Server.Enums;

namespace Server.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? RelatedMatchId { get; set; }
    public int? RelatedTeamId { get; set; }
    public bool IsEmail { get; set; } = false;
    public string EmailStatus { get; set; } = "None";
    public string? RecipientEmail { get; set; }
}