using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Enums;
using Server.Interfaces;
using Server.Models;

namespace Server.Services;

public class InviteService : IInviteService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    public InviteService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }
    public async Task<string> SendInviteAsync(SendInviteDto dto, int captainId)
    {
        var isCaptain = await _context.TeamMembers
            .AnyAsync(tm => tm.Team.Id == dto.TeamId && tm.User.Id == captainId
            && tm.RoleInTeam == UserRole.Captain && tm.Active);

        if (!isCaptain)
            return "Korisnik nije kapiten tima";
        var team = await _context.Teams
            .Include(t => t.League)
            .FirstOrDefaultAsync(t => t.Id == dto.TeamId);

        if (team == null || !team.Active)
            return "Tim nije pronađen ili je ugašen.";
        
        if (team.League != null && team.League.MatchType == Enums.MatchType.Basket_3X3)
        {
            if (DateTime.UtcNow >= team.League.RegistrationDeadline)
            {
                return "Nije moguće slati pozivnice dok je 3x3 liga u toku.";
            }
        }

        var targetPlayer = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == dto.TargetUserId);
        if (targetPlayer == null)
            return "Korisnik kojeg pokušavate da pozovete ne postoji.";

        var alreadyInTeam = await _context.TeamMembers
            .AnyAsync(tm => tm.Team.Id == dto.TeamId && tm.User.Id == dto.TargetUserId && tm.Active);
        if (alreadyInTeam)
            return "Ovaj igrač je već član vašeg tima.";

        var isAlreadyInLeague = await _context.TeamMembers
        .AnyAsync(tm => tm.User.Id == dto.TargetUserId 
                     && tm.Team.League.Id == team.League!.Id 
                     && tm.Active);

        if (isAlreadyInLeague)
            return "Igrač je već član drugog tima u ovoj ligi.";

        var pendingInvite = await _context.TeamInvites
        .AnyAsync(i => i.Team != null && i.Team.Id == dto.TeamId
                    && i.Invitee != null && i.Invitee.Id == dto.TargetUserId
                    && i.Status == InviteStatus.Pending);
        if (pendingInvite) return "Već ste poslali pozivnicu ovom igraču, sačekajte njegov odgovor.";

        var sender = await _context.Users.FindAsync(captainId);
        var invite = new TeamInvite
        {
            Team = team,
            Invitee = targetPlayer,
            Sender = sender,
            Status = InviteStatus.Pending,
            SentAt = DateTime.UtcNow
        };

        _context.TeamInvites.Add(invite);
        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(
            targetPlayer.Id,
            "Nova pozivnica za tim",
            $"Dobili ste poziv da igrate za tim {team.Name}",
            NotificationType.TeamInvite,
            true,
            relatedTeamId: team.Id
        );

        return "OK";
    }
    public async Task<List<InviteDto>?> GetMyInvitesAsync(int userId)
    {
        return await _context.TeamInvites
        .Include(i => i.Team)
        .Include(i => i.Sender)
        .Include(i => i.Invitee)
        .Where(i => i.Invitee != null && i.Invitee.Id == userId && i.Status == InviteStatus.Pending)
        .Select(i => new InviteDto
        {
            Id = i.Id,
            TeamName = i.Team != null ? i.Team.Name : "Nepoznat tim",
            SenderUsername = i.Sender != null ? i.Sender.Username : "Nepoznat korisnik",
            Status = i.Status.ToString(),
            SentAt = i.SentAt
        })
        .ToListAsync();
    }

    public async Task<string> RespondToInviteAsync(int userId, int inviteId, bool accept)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invite = await _context.TeamInvites
            .Include(i => i.Team)
            .Include(i => i.Invitee)
            .FirstOrDefaultAsync(i => i.Id == inviteId && i.Invitee!.Id == userId);

            if (invite == null) return "Pozivnica nije pronađena.";

            if (invite.Team == null || invite.Invitee == null)
                return "Greška: Podaci o timu ili korisniku nedostaju.";

            if (invite.Status != InviteStatus.Pending) return "Pozivnica je već obrađena.";

            if (!accept)
            {
                invite.Status = InviteStatus.Declined;
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return "Odbili ste pozivnicu.";
            }

            var existingMember = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.Team.Id == invite.Team.Id && tm.User.Id == invite.Invitee.Id);

            if (existingMember != null)
            {
                existingMember.Active = true;
                existingMember.DateJoined = DateTime.UtcNow;
            }
            else
            {
                var member = new TeamMember
                {
                    User = invite.Invitee,
                    Team = invite.Team,
                    RoleInTeam = UserRole.Player,
                    DateJoined = DateTime.UtcNow,
                    Active = true
                };
                _context.TeamMembers.Add(member);
            }

            invite.Status = InviteStatus.Accepted;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return "OK";
        }

        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    public async Task<string> CancelInviteAsync(int inviteId, int captainId)
    {
        var invite = await _context.TeamInvites
            .Include(i => i.Team)
            .FirstOrDefaultAsync(i => i.Id == inviteId);

        if (invite == null)
            return "Ova pozivnica ne postoji";

        if (invite.Team == null)
        {
            _context.TeamInvites.Remove(invite);
            await _context.SaveChangesAsync();
            return "Pozivnica je obrisana jer tim više ne postoji.";
        }

        var isCaptain = await _context.TeamMembers
            .AnyAsync(tm => tm.Team.Id == invite.Team.Id && tm.User.Id == captainId
            && tm.RoleInTeam == UserRole.Captain && tm.Active);

        if (!isCaptain)
            return "Korisnik nije kapiten tima";



        _context.TeamInvites.Remove(invite);
        await _context.SaveChangesAsync();
        return "OK";
    }

    public async Task<List<UserProfileDto>?> GetAvailablePlayersAsync(int leagueId)
    {
        var busyPlayerIds = await _context.TeamMembers
            .Where(tm => tm.Active && tm.Team.League.Id == leagueId)
            .Select(tm => tm.User.Id)
            .ToListAsync();

        return await _context.Users
            .Where(u => !busyPlayerIds.Contains(u.Id)  && u.GlobalRole == UserRole.Player )
            .Select(u => new UserProfileDto
            {
                Id = u.Id,
                Username = u.Username,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Teams = new(),
                MatchHistory = new()
            })
            .ToListAsync();
    }

    public async Task<List<InviteDto>?> GetSentInvitesAsync(int senderId)
    {
        return await _context.TeamInvites
            .Include(i => i.Team)
            .Include(i => i.Invitee)
            .Where(i => i.Sender != null && i.Sender.Id == senderId)
            .Select(i => new InviteDto
            {
                Id = i.Id,
                TeamName = i.Team != null ? i.Team.Name : "Nepoznat tim",
                InviteeUsername = i.Invitee != null ? i.Invitee.Username : "Nepoznat korisnik",
                Status = i.Status.ToString(),
                SentAt = i.SentAt
            })
            .ToListAsync();

    }
}