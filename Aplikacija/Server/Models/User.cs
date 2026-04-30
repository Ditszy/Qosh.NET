using Microsoft.AspNetCore.Identity;
namespace Server.Models;
public class User
{
    public int ID {get; set;}
    public required string username{get; set;}
    public required string passwordHash{get; set;}
    public required string email{get; set;}
    public UserRole? globalRole {get; set;}
    public string firstName{get; set;}
    public string lastName{get; set;}
}