namespace Server.DTOs;

public class InviteDto
{
    public int Id { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string SenderUsername { get; set; } = string.Empty;
    public string? InviteeUsername { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}