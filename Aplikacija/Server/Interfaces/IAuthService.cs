using Server.DTOs;
using Server.Models;

namespace Server.Interfaces;

public interface IAuthService
{
    Task<User?> Register(RegisterDto registerDto);
    Task<(string? AccessToken, string? RefreshToken)> Login(LoginDto loginDto);
    Task<(string? AccessToken, string? RefreshToken)> Refresh(string refreshToken);
}