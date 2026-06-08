using Server.DTOs;

namespace Server.Interfaces;

public interface IMatchService
{
    Task<string> StartMatchAsync(int id, int requestUserId, string requestUserRole);
    Task<string> PauseMatchAsync(int id, int requestUserId, string requestUserRole);
    Task<string> EndMatchAsync(int id, int requestUserId, string requestUserRole);
    Task<string> SubmitRefereeReportAsync(int id, RefereeReportDto dto, int requestUserId, string requestUserRole);
    Task<string> AssignMVPOfMatchAsync(int id, int userId, int requestUserId, string requestUserRole);
}