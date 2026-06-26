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
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config, IAdminLogService adminLogService, IEmailService emailService)
    {
        _context = context;
        _config = config;
        _adminLogService = adminLogService;
        _emailService = emailService;
    }

    public async Task<User?> Register(RegisterDto dto)
    {
        if (dto.Username.Contains(' ') || dto.Username.Contains('\t'))
            throw new ArgumentException("Korisničko ime ne sme sadržati razmake.");

        if (dto.Password.Length < 6)
            throw new ArgumentException("Lozinka mora imati najmanje 6 karaktera.");

        if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"\d"))
            throw new ArgumentException("Lozinka mora sadržati bar jedan broj.");

        if (!dto.Password.Any(c => !char.IsLetterOrDigit(c)))
            throw new ArgumentException("Lozinka mora sadržati bar jedan specijalni karakter.");

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

    private string GenerateToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return;

        var existingTokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && !t.Used)
            .ToListAsync();
        foreach (var t in existingTokens) t.Used = true;

        var token = new PasswordResetToken
        {
            Token = GenerateToken(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
        _context.PasswordResetTokens.Add(token);
        await _context.SaveChangesAsync();

        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
        var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token.Token)}";

        try
        {
            await _emailService.SendEmailAsync(
                user.Email,
                "Resetovanje lozinke - QOSH",
                $"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1976d2;">Resetovanje lozinke</h2>
                    <p>Zdravo <strong>{user.Username}</strong>,</p>
                    <p>Primili smo zahtev za resetovanje lozinke na vašem QOSH nalogu.</p>
                    <p>Kliknite na dugme ispod da postavite novu lozinku:</p>
                    <a href="{resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Resetuj lozinku</a>
                    <p style="color: #666; font-size: 13px;">Link važi 1 sat. Ako niste tražili resetovanje, ignorišite ovaj email.</p>
                </div>
                """);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] GREŠKA pri slanju emaila za resetovanje lozinke ({user.Email}): {ex.Message}");
        }
    }

    public async Task<string> ResetPasswordAsync(string token, string newPassword)
    {
        var resetToken = await _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.Used);

        if (resetToken == null)
            return "Nevalidan ili istekao token.";

        if (resetToken.ExpiresAt < DateTime.UtcNow)
            return "Token je istekao.";

        if (newPassword.Length < 6)
            throw new ArgumentException("Lozinka mora imati najmanje 6 karaktera.");

        if (!System.Text.RegularExpressions.Regex.IsMatch(newPassword, @"\d"))
            throw new ArgumentException("Lozinka mora sadržati bar jedan broj.");

        if (!newPassword.Any(c => !char.IsLetterOrDigit(c)))
            throw new ArgumentException("Lozinka mora sadržati bar jedan specijalni karakter.");

        using var hmac = new HMACSHA512();
        resetToken.User.PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(newPassword));
        resetToken.User.PasswordSalt = hmac.Key;
        resetToken.Used = true;

        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task SendVerificationEmailAsync(User user)
    {
        var existingTokens = await _context.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && !t.Used)
            .ToListAsync();
        foreach (var t in existingTokens) t.Used = true;

        var token = new EmailVerificationToken
        {
            Token = GenerateToken(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(2)
        };
        _context.EmailVerificationTokens.Add(token);
        await _context.SaveChangesAsync();

        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
        var verifyLink = $"{frontendUrl}/verify-email?token={Uri.EscapeDataString(token.Token)}";

        try
        {
            await _emailService.SendEmailAsync(
                user.Email,
                "Verifikacija email adrese - QOSH",
                $"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1976d2;">Verifikacija email adrese</h2>
                    <p>Zdravo <strong>{user.Username}</strong>,</p>
                    <p>Hvala vam što ste se registrovali na QOSH!</p>
                    <p>Kliknite na dugme ispod da verifikujete svoju email adresu:</p>
                    <a href="{verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Verifikuj email</a>
                    <p style="color: #666; font-size: 13px;">Link važi 2 dana. Ako se niste registrovali, ignorišite ovaj email.</p>
                </div>
                """);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] GREŠKA pri slanju verifikacionog emaila ({user.Email}): {ex.Message}");
        }
    }

    public async Task<string> VerifyEmailAsync(string token)
    {
        var verifyToken = await _context.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.Used);

        if (verifyToken == null)
            return "Nevalidan ili istekao token.";

        if (verifyToken.ExpiresAt < DateTime.UtcNow)
            return "Token je istekao.";

        verifyToken.User.IsEmailVerified = true;
        verifyToken.Used = true;

        await _context.SaveChangesAsync();
        return "OK";
    }
}