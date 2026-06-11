namespace Server.DTOs;

public class MatchPlayDto
{
    public int Id { get; set; }
    public string Time { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Score { get; set; } = string.Empty;
}
