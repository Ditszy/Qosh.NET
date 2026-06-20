namespace Server.DTOs;

public class PlayerMatchHistoryDto
{
    public int Points { get; set; }
    public int Assists { get; set; }
    public int Rebounds { get; set; }
    public DateTime Date { get; set; }
}