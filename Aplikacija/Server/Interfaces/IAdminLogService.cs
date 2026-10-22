using Server.Models;

namespace Server.Interfaces;

public interface IAdminLogService
{
    Task LogAsync(string action, string details, string adminUsername);
    Task<List<AdminLog>> GetLogsAsync(int page = 1, int pageSize = 50);
}
