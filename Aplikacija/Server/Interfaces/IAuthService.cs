using Server.DTOs;
using Server.Models;

namespace Server.Interfaces;

public interface IAuthService
{
    Task<User?> Register(RegisterDto registerDto);
    Task<string?> Login(LoginDto loginDto);
}