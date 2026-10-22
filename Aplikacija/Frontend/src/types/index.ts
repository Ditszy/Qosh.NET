// Enumi

export const UserRole = {
    Admin: 1,
    Organizer: 2,
    Referee: 3,
    Scorer: 4,
    Captain: 5,
    Player: 6,
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MatchStatus = {
    Scheduled: 1,
    Live: 2,
    Finished: 3,
    Canceled: 4,
    Paused: 5,
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const MatchType = {
    Classic_5x5: 1,
    Basket_3X3: 2,
} as const;
export type MatchType = (typeof MatchType)[keyof typeof MatchType];

export const InviteStatus = {
    Pending: 1,
    Accepted: 2,
    Declined: 3,
} as const;
export type InviteStatus = (typeof InviteStatus)[keyof typeof InviteStatus];

// DTO

export interface UserDto {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    globalRole?: UserRole;
    isActive: boolean;
    dateOfBirth?: string;
}

export interface TeamMemberDto {
    id: number;
    userId: number;
    username: string;
    firstName?: string;
    lastName?: string;
    roleInTeam?: UserRole;
    dateJoined: string;
    active: boolean;
}

export interface TeamDto {
    id: number;
    name: string;
    city?: string;
    logoUrl?: string;
    leagueId?: number;
    leagueName?: string;
    members: TeamMemberDto[];
}

export interface MatchDto {
    id: number;
    leagueId?: number;
    leagueName?: string;
    homeTeamId?: number;
    homeTeamName?: string;
    awayTeamId?: number;
    awayTeamName?: string;
    homeScore?: number;
    awayScore?: number;
    startTime: string;
    roundNumber: number;
    matchNumber: number;
    location?: string;
    status: MatchStatus;
    refereeId?: number;
    refereeName?: string;
    scorerId?: number;
    scorerName?: string;
}

export interface LeagueDto {
    id: number;
    name: string;
    season?: string;
    matchType: MatchType;
    registrationDeadline: string;
    startDate?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    leagueStatus?: number;
    isPublic: boolean;
    description?: string;
    maxTeams: number;
    entryFee: number;
    creatorId?: number;
    creatorUsername?: string;
    teamCount: number;
    teams: TeamDto[];
    matches: MatchDto[];
}

export interface InviteDto {
    id: number;
    teamId: number;
    teamName: string;
    senderId: number;
    senderUsername: string;
    inviteeId: number;
    inviteeUsername: string;
    status: InviteStatus;
    sentAt: string;
}

// UserMatchStats.cs
export interface UserMatchStatsDto {
    id?: number;
    userId: number;
    username: string;
    matchId?: number;
    points: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    twoPointersMade: number;
    twoPointersAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    rebounds: number;
    assists: number;
    fouls: number;
    steals: number;
    blocks: number;
}

export interface PlayerStatsDto {
    userId: number;
    username: string;
    avgPoints: number;
    avgRebounds: number;
    avgAssists: number;
    avgFouls: number;
    avgSteals: number;
    avgBlocks: number;
    gamesPlayed: number;
}

export interface LiveMatchUpdateDto {
    matchId: number;
    homeScore?: number;
    awayScore?: number;
    status: MatchStatus;
    playerStats: UserMatchStatsDto[];
}

export interface LeaderboardEntryDto {
    userId: number;
    username: string;
    value: number;
}

// Auth

export interface AuthUser {
    id: number;
    username: string;
    role: UserRole;
    token: string;
}

// Notifications

export const NotificationType = {
    TeamInvite: 'TeamInvite',
    MatchRescheduled: 'MatchRescheduled',
    MatchCanceled: 'MatchCanceled',
    General: 'General',
    LeagueStarted: 'LeagueStarted',
    OfficialAssigned: 'OfficialAssigned',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface NotificationDto {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    relatedMatchId?: number;
    relatedTeamId?: number;
}