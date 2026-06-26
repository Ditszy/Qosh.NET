using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Interfaces;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;
    public AuthController(IAuthService authService, AppDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    [HttpPost("Register")]
    public async Task<ActionResult<User>> Register(RegisterDto dto)
    {
        try
        {
            var user = await _authService.Register(dto);
            if (user == null) return BadRequest("Korisničko ime ili e-mail su zauzeti");

            await _authService.SendVerificationEmailAsync(user);
            return Ok();
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }

    [HttpPost("Login")]
    public async Task<ActionResult> Login(LoginDto dto)
    {
        try
        {
            var (accessToken, refreshToken) = await _authService.Login(dto);

            if (accessToken == null || refreshToken == null)
                return Unauthorized("Nevalidno korisničko ime ili lozinka");

            SetRefreshTokenCookie(refreshToken);
            return Ok(new { token = accessToken });
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }

    [HttpPost("Refresh")]
    public async Task<ActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken)) return Unauthorized();

        var (accessToken, newRefreshToken) = await _authService.Refresh(refreshToken);

        if (accessToken == null || newRefreshToken == null)
            return Unauthorized();

        SetRefreshTokenCookie(newRefreshToken);
        return Ok(new { token = accessToken });
    }

    [HttpPost("Logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                await _context.SaveChangesAsync();
            }
        }

        Response.Cookies.Delete("refreshToken");
        return Ok();
    }

    [HttpPost("Forgot-Password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        await _authService.ForgotPasswordAsync(dto.Email);
        return Ok("Ako postoji nalog sa ovom email adresom, poslat vam je link za resetovanje lozinke.");
    }

    [HttpPost("Reset-Password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            var result = await _authService.ResetPasswordAsync(dto.Token, dto.NewPassword);
            if (result != "OK") return BadRequest(result);
            return Ok("Lozinka je uspešno promenjena.");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }

    [HttpPost("Verify-Email")]
    public async Task<ActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
    {
        var result = await _authService.VerifyEmailAsync(dto.Token);
        if (result != "OK") return BadRequest(result);
        return Ok("Email je uspešno verifikovan.");
    }

    [HttpGet("Check-Email-Token")]
    public async Task<ActionResult> CheckEmailToken([FromQuery] string token)
    {
        var exists = await _context.EmailVerificationTokens
            .AnyAsync(t => t.Token == token && !t.Used && t.ExpiresAt > DateTime.UtcNow);
        return Ok(new { valid = exists });
    }

    [HttpGet("Check-Reset-Token")]
    public async Task<ActionResult> CheckResetToken([FromQuery] string token)
    {
        var exists = await _context.PasswordResetTokens
            .AnyAsync(t => t.Token == token && !t.Used && t.ExpiresAt > DateTime.UtcNow);
        return Ok(new { valid = exists });
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var isDev = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development"
                    || Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == null;

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(7)
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}