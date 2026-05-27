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

    [HttpPost("Register")]
    public async Task<ActionResult<User>> Register(RegisterDto dto)
    {
        try
        {
            var user = await _authService.Register(dto);
            return user == null ? BadRequest("Korisničko ime je zauzeto") : Ok(user);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }

    [HttpPost("Login")]
    public async Task<ActionResult<string>> Login(LoginDto dto)
    {
        try
        {
            var token = await _authService.Login(dto);
            return token == null ? Unauthorized("Nevalidno korisničko ime ili lozinka") : Ok(new { token });
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
}