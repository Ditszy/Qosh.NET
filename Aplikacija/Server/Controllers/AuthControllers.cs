using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Interfaces;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    public async Task<ActionResult<User>> Register(RegisterDto dto)
    {
        var user = await _authService.Register(dto);
        return user == null ? BadRequest("Korisničko ime je zauzeto") : Ok(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<string>> Login(LoginDto dto)
    {
        var token = await _authService.Login(dto);
        return token == null ? Unauthorized("Nevalidno korisničko ime ili lozinka") : Ok(new { token });
    }
}