namespace Server.DTOs;

public class ChangeLocationDto
{
    public int MatchId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Location { get; set; }="string";
}