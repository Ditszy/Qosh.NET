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
            return user == null ? BadRequest("Korisničko ime ili e-mail su zauzeti") : Ok();
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