namespace Server.DTOs;

public class TeamMemberDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public DateTime DateJoined { get; set; }
    public string? Role { get; set; }
}