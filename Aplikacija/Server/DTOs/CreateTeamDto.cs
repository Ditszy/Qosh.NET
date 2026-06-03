namespace Server.DTOs;

public class CreateTeamDto
{
    public required string Name { get; set; }
    public string? City { get; set; }
}