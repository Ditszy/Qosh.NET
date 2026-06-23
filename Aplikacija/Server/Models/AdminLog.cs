namespace Server.Models;

public class AdminLog
{
    public int Id { get; set; }
    public required string Action { get; set; }
    public required string Details { get; set; }
    public required string AdminUsername { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
