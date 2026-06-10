using Server.DTOs;

namespace Server.Interfaces;

public interface IInviteService
{
    Task<string> SendInviteAsync(SendInviteDto dto, int captainId);

    Task<List<InviteDto>?> GetMyInvitesAsync(int userId);

    Task<string> RespondToInviteAsync(int userId, int inviteId, bool accept);

    Task<string> CancelInviteAsync(int teamId, int leagueId);

    Task<List<UserProfileDto>?> GetAvailablePlayersAsync();

    Task<List<InviteDto>?> GetSentInvitesAsync(int senderId);
}