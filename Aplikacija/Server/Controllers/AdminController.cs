namespace Server.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Server.Constants;
using Server.DTOs;
using Server.Data;
using Server.Interfaces;
using Server.Models;
using Server.Enums;

[ApiController]
[Authorize(Roles = UserRoles.Admin)]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAuthService _adminService;
    private readonly AppDbContext _context;

    public AdminController(IAuthService adminService, AppDbContext context)
    {
        _adminService = adminService;
        _context = context;
    }
    [HttpPost("Create-Official-Account/{role}")]
    public async Task<ActionResult<User>> CreateOfficialAccount([FromBody]RegisterDto dto,[FromRoute] UserRole role)
    {
        try
        {
            var user = await _adminService.Register(dto);
            if (user == null) 
                return BadRequest("Korisničko ime ili email su zauzeti");
            user.GlobalRole = role;
            await _context.SaveChangesAsync();
            return Ok($"Uspesno je napravljen korisnik.");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPost("Assign-Role/{newRole}")]
    public async Task<ActionResult<User>> AssignRole([FromBody]UsernameDto dto, [FromRoute]UserRole newRole)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
            if (user == null) 
                return BadRequest("Korisnik ne postoji");
            user.GlobalRole = newRole;
            await _context.SaveChangesAsync();
            return Ok($"Korisniku '{user.Username}' je promenjena uloga.");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpGet("Get-System-Logs")]
    public async Task<ActionResult<User>> GetSystemLogs()
    {
        try
        {
            return BadRequest("Nije implementirano jos uvek");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPut("Deactivate-User")]
    public async Task<ActionResult<User>> DeactivateUser([FromBody]UsernameDto dto)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
            if (user == null) 
                return BadRequest("Korisnik ne postoji");
            if (!user.IsActive)
            {
                return BadRequest($"Korisnik '{user.Username}' je već deaktiviran.");
            }
            user.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok($"Korisnik '{user.Username}' je deaktiviran.");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    
    [HttpPut("Activate-User")]
    public async Task<ActionResult<User>> ActivateUser([FromBody]UsernameDto dto)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
            if (user == null) 
                return BadRequest("Korisnik ne postoji");
            if (user.IsActive)
            {
                return BadRequest($"Korisnik '{user.Username}' je već aktiviran.");
            }
            user.IsActive = true;
            await _context.SaveChangesAsync();
            return Ok($"Korisnik '{user.Username}' je aktiviran.");
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
}