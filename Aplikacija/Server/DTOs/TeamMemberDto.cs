namespace Server.DTOs;

public class TeamMemberDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int? JerseyNumber { get; set; }
    public DateTime DateJoined { get; set; }
    public string? Role { get; set; }
}