using Server.Models;
using Server.DTOs;

namespace Server.Interfaces;

public interface ITeamService
{
    Task<string> CreateTeamAsync(CreateTeamDto dto, int userId);

    Task<List<TeamMemberDto>?> GetTeamRosterAsync(int teamId);

    Task<string> CheckTeamEligibilityAsync(int teamId, int leagueId);

    Task<string> DisbandTeamAsync(int teamId, int leagueId);

    Task<string> RemovePlayerFromRosterAsync(int teamId, int userIdToRemove, int currentUserId);

    Task<string> TransferCaptaincyAsync(int teamId, int newCaptainId, int currentUserId);
    Task<string> UploadTeamLogoAsync(int teamId, IFormFile file, int currentUserId);
}