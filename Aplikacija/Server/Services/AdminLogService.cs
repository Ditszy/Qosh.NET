using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Interfaces;
using Server.Models;

namespace Server.Services;

public class AdminLogService : IAdminLogService
{
    private readonly AppDbContext _context;

    public AdminLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string action, string details, string adminUsername)
    {
        var log = new AdminLog
        {
            Action = action,
            Details = details,
            AdminUsername = adminUsername,
            Timestamp = DateTime.UtcNow
        };

        _context.AdminLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AdminLog>> GetLogsAsync(int page = 1, int pageSize = 50)
    {
        return await _context.AdminLogs
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
}
