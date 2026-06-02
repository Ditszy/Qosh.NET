namespace Server.Dtos;

public class CreateTeamDto
{
    public required string Name { get; set; }
    public string? City { get; set; }
}