using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public class AppDbContext : DbContext
{
    public required DbSet<League> Leagues { get; set; }
    public required DbSet<Match> Matches { get; set; }
    public required DbSet<Team> Teams { get; set; }
    public required DbSet<TeamInvite> TeamInvites { get; set; }
    public required DbSet<TeamMember> TeamMembers { get; set; }
    public required DbSet<User> Users { get; set; }
    public required DbSet<UserMatchStats> UserMatchStats { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<MatchPlay> MatchPlays { get; set; }
    public DbSet<Vote> Votes { get; set; }
    public DbSet<AdminLog> AdminLogs { get; set; }

    public AppDbContext(DbContextOptions options) : base(options) { }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Vote>(entity =>
        {
            entity.HasIndex(v => new { v.MatchId, v.UserId }).IsUnique();
            entity.HasOne<Match>().WithMany().HasForeignKey(v => v.MatchId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
