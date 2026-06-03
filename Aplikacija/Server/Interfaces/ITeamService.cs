using Server.Models;
using Server.DTOs;

namespace Server.Interfaces;
public interface ITeamService
{
    Task<Team?> CreateTeamAsync(CreateTeamDto dto, int userId);

    Task<List<TeamMemberDto>> GetTeamRosterAsync(int teamId);

    Task<bool> CheckTeamEligibilityAsync(int teamId, int leagueId, int currentUserId);

    Task<bool> DisbandTeamAsync(int teamId, int currentUserId);

    Task<bool> RemovePlayerFromRosterAsync(int teamId, int userIdToRemove, int currentUserId);

    Task<bool> TransferCaptaincyAsync(int teamId, int newCaptainId, int currentUserId);
    Task<bool> UploadTeamLogoAsync(int teamId, IFormFile file, int currentUserId);
}