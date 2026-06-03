using Server.DTOs;
using Server.Interfaces;
using Server.Models;

namespace Server.Services;

public class TeamService : ITeamService
{
    public Task<bool> CheckTeamEligibilityAsync(int teamId, int leagueId, int currentUserId)
    {
        throw new NotImplementedException();
    }

    public Task<Team?> CreateTeamAsync(CreateTeamDto dto, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DisbandTeamAsync(int teamId, int currentUserId)
    {
        throw new NotImplementedException();
    }

    public Task<List<TeamMemberDto>> GetTeamRosterAsync(int teamId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> RemovePlayerFromRosterAsync(int teamId, int userIdToRemove, int currentUserId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> TransferCaptaincyAsync(int teamId, int newCaptainId, int currentUserId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> UploadTeamLogoAsync(int teamId, IFormFile file, int currentUserId)
    {
        throw new NotImplementedException();
    }
}