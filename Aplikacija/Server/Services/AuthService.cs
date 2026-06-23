using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Constants;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Server.Models;

namespace Server.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IAdminLogService _adminLogService;

    public AuthService(AppDbContext context, IConfiguration config, IAdminLogService adminLogService)
    {
        _context = context;
        _adminLogService = adminLogService;
    }

    public async Task<User?> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(x => x.Username == dto.Username || x.Email == dto.Email)) return null;

        using var hmac = new HMACSHA512();

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            DateOfBirth = dto.DateOfBirth,
            ProfilePictureUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + dto.Username,
            PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dto.Password)), // Generise hash
            PasswordSalt = hmac.Key, // Generise salt
            GlobalRole = UserRole.Player // Default uloga nakon registracije
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await _adminLogService.LogAsync("Registracija korisnika", $"Novi korisnik '{dto.Username}' ({dto.Email}) registrovan sa ulogom Player.", dto.Username);
        return user;
    }

    public async Task<(string? AccessToken, string? RefreshToken)> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Username == dto.Username);
        if (user == null) return (null, null);
        if (user.IsActive == false) return (null, null);

        using var hmac = new HMACSHA512(user.PasswordSalt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dto.Password));

        for (int i = 0; i < computedHash.Length; i++)
        {
            if (computedHash[i] != user.PasswordHash[i]) return (null, null);
        }

        var accessToken = CreateToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return (accessToken, refreshToken);
    }

    public async Task<(string? AccessToken, string? RefreshToken)> Refresh(string refreshToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            return (null, null);
        if (user.IsActive == false) return (null, null);

        var newAccessToken = CreateToken(user);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return (newAccessToken, newRefreshToken);
    }

    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.Role, user.GlobalRole?.ToString() ?? UserRoles.Player)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("TOKEN_KEY")!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(15),
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}