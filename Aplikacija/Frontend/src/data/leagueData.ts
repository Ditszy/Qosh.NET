import { MatchStatus, MatchType } from '../types';

export interface LeagueSummary {
    id: number;
    name: string;
    season: string;
    matchType: MatchType;
    registrationDeadline: string;
    location: string;
    teams: number;
    maxTeams: number;
    phaseLabel: string;
}

export interface BracketMatch {
    id: number;
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    status: MatchStatus;
    startTime: string;
}

export interface BracketRound {
    round: number;
    title: string;
    matches: BracketMatch[];
}

export interface RoundRobinStanding {
    id: number;
    team: string;
    played: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    points: number;
}

export interface RoundRobinMatch {
    id: number;
    round: number;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    status: MatchStatus;
    startTime: string;
}

export interface RoundRobinData {
    standings: RoundRobinStanding[];
    matches: RoundRobinMatch[];
}

//test podaci
export const leagues: LeagueSummary[] = [
    {
        id: 1,
        name: 'Letnja 3x3 Liga',
        season: '2026',
        matchType: MatchType.Basket_3X3,
        registrationDeadline: '15.06.2026',
        location: 'Niš',
        teams: 6,
        maxTeams: 12,
        phaseLabel: 'Prijave otvorene',
    },
    {
        id: 2,
        name: 'Gradska 5x5 Liga',
        season: '2026',
        matchType: MatchType.Classic_5x5,
        registrationDeadline: '01.05.2026',
        location: 'Beograd',
        teams: 10,
        maxTeams: 12,
        phaseLabel: 'U toku',
    },
    {
        id: 3,
        name: 'Zimski 3x3 Kup',
        season: '2026/27',
        matchType: MatchType.Basket_3X3,
        registrationDeadline: '10.11.2026',
        location: 'Kragujevac',
        teams: 0,
        maxTeams: 8,
        phaseLabel: 'U pripremi',
    },
];

export const bracketByLeagueId: Record<number, BracketRound[]> = {
    1: [
        {
            round: 1,
            title: 'Četvrtfinale',
            matches: [
                {
                    id: 101,
                    matchNumber: 1,
                    homeTeam: 'KK Marinos',
                    awayTeam: 'KK Andrija',
                    homeScore: 21,
                    awayScore: 17,
                    status: MatchStatus.Finished,
                    startTime: '31.05.2026 • 18:00',
                },
                {
                    id: 102,
                    matchNumber: 2,
                    homeTeam: 'KK Vučina',
                    awayTeam: 'KK Sićevo',
                    status: MatchStatus.Scheduled,
                    startTime: '31.05.2026 • 18:40',
                },
            ],
        },
        {
            round: 2,
            title: 'Polufinale',
            matches: [
                {
                    id: 201,
                    matchNumber: 1,
                    homeTeam: 'KK Marinos',
                    awayTeam: 'Pobednik QF2',
                    status: MatchStatus.Scheduled,
                    startTime: '31.05.2026 • 20:00',
                },
            ],
        },
        {
            round: 3,
            title: 'Finale',
            matches: [
                {
                    id: 301,
                    matchNumber: 1,
                    homeTeam: 'Pobednik SF',
                    awayTeam: 'TBD',
                    status: MatchStatus.Scheduled,
                    startTime: '31.05.2026 • 21:00',
                },
            ],
        },
    ],
    3: [
        {
            round: 1,
            title: 'Polufinale',
            matches: [
                {
                    id: 401,
                    matchNumber: 1,
                    homeTeam: 'TBD',
                    awayTeam: 'TBD',
                    status: MatchStatus.Scheduled,
                    startTime: '15.11.2026 • 18:00',
                },
                {
                    id: 402,
                    matchNumber: 2,
                    homeTeam: 'TBD',
                    awayTeam: 'TBD',
                    status: MatchStatus.Scheduled,
                    startTime: '15.11.2026 • 18:40',
                },
            ],
        },
    ],
};

export const roundRobinByLeagueId: Record<number, RoundRobinData> = {
    2: {
        standings: [
            { id: 1, team: 'KK Beograd', played: 6, wins: 5, losses: 1, pointsFor: 512, pointsAgainst: 470, points: 11 },
            { id: 2, team: 'KK Zvezda', played: 6, wins: 4, losses: 2, pointsFor: 498, pointsAgainst: 480, points: 10 },
            { id: 3, team: 'KK Partizan', played: 6, wins: 3, losses: 3, pointsFor: 476, pointsAgainst: 482, points: 9 },
            { id: 4, team: 'KK Radnički', played: 6, wins: 2, losses: 4, pointsFor: 451, pointsAgainst: 495, points: 8 },
        ],
        matches: [
            {
                id: 501,
                round: 5,
                homeTeam: 'KK Beograd',
                awayTeam: 'KK Radnički',
                homeScore: 78,
                awayScore: 70,
                status: MatchStatus.Finished,
                startTime: '28.05.2026 • 19:00',
            },
            {
                id: 502,
                round: 5,
                homeTeam: 'KK Zvezda',
                awayTeam: 'KK Partizan',
                status: MatchStatus.Live,
                startTime: '28.05.2026 • 20:30',
            },
            {
                id: 503,
                round: 6,
                homeTeam: 'KK Partizan',
                awayTeam: 'KK Radnički',
                status: MatchStatus.Scheduled,
                startTime: '02.06.2026 • 18:00',
            },
        ],
    },
};
