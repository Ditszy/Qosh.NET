using Microsoft.EntityFrameworkCore;

namespace Server.Models;

public class AppDbContext : DbContext
{
    public required DbSet<League> Leagues{get;set;}
    public required DbSet<Match> Matches{get;set;}
    public required DbSet<Team> Teams{get;set;}
    public required DbSet<TeamInvite> TeamInvites{get;set;}
    public required DbSet<TeamMember> TeamMembers{get;set;}
    public required DbSet<User> Users{get;set;}
    public required DbSet<UserMatchStats> UserMatchStats{get;set;}
    public AppDbContext(DbContextOptions options):base(options){}
}