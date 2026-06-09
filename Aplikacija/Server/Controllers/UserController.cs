using Microsoft.AspNetCore.Mvc;
using Server.DTOs;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("{id}/profile")]
    public async Task<IActionResult> GetProfile(int id)
    {
        var profile = await _userService.GetProfileAsync(id);

        if (profile == null)
        {
            return NotFound(new { message = "Korisnik nije pronađen." });
        }

        return Ok(profile);
    }
    [HttpPut("{id}/update")]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateProfileDto dto)
    {
        try
        {
            var result = await _userService.UpdateProfileAsync(id, dto);

            if (result == "OK")
                return Ok("Profil je uspešno ažuriran.");

            return BadRequest(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpGet("{id}/notifications")]
    public async Task<IActionResult> GetNotifications(int id)
    {
        try
        {
            var notifications = await _userService.GetNotificationsAsync(id);
            return Ok(notifications);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPatch("notifications/{notificationId}/read")]
    public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
    {
        try
        {
            var result = await _userService.MarkNotificationAsReadAsync(notificationId);

            if (result == "OK")
                return Ok("Obaveštenje je označeno kao pročitano.");

            return BadRequest(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpDelete("{id}/delete")]
    public async Task<IActionResult> DeleteAccount(int id)
    {
        try
        {
            var result = await _userService.DeleteAccountAsync(id);

            if (result == "OK")
                return Ok("Nalog je uspešno obrisan i lični podaci su anonimizirani.");

            return BadRequest(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
    [HttpPut("{id}/change-password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
    {
        try
        {
            var result = await _userService.ChangePasswordAsync(id, dto);

            if (result == "OK")
                return Ok("Lozinka je uspešno promenjena.");

            return BadRequest(result);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
}