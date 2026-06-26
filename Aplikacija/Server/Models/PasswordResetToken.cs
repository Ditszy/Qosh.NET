using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models;

public class PasswordResetToken
{
    public int Id { get; set; }
    public required string Token { get; set; }
    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; } = false;
}
