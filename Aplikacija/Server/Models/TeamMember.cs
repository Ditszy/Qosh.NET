using Microsoft.AspNetCore.Identity;

namespace Server.Models;
public class TeamMember
{
    public int ID{get; set;}
    public required int userId{get; set;}
    public required int teamId{get; set;}
    public UserRole? roleInTeam{get; set;}
}