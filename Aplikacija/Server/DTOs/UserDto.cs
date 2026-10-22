using Server.Enums;

namespace Server.DTOs;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsActive { get; set; }
    public UserRole? GlobalRole { get; set; }
    public string? DateOfBirth { get; set; }
    public string? ProfilePictureUrl { get; set; }
}
