namespace Server.Models;
public class TeamInvite
{
    public int ID {get; set;}
    public required int teamId {get; set;}
    public required int inviteeId {get; set;}
    public required int senderId {get; set;}
    public required InviteStatus status{get; set;}
    public required DateTime sentAt{get; set;}
}