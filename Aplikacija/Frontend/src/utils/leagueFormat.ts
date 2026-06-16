import { MatchStatus, MatchType } from '../types';

export const matchTypeLabel = (matchType: MatchType) =>
    matchType === MatchType.Basket_3X3 ? '3x3' : '5x5';

export const competitionSystemLabel = (matchType: MatchType) =>
    matchType === MatchType.Basket_3X3 ? 'Eliminacije (knockout)' : 'Round robin';

export const matchStatusLabel = (status: MatchStatus) => {
    switch (status) {
        case MatchStatus.Live:
            return 'U toku';
        case MatchStatus.Finished:
            return 'Završena';
        case MatchStatus.Canceled:
            return 'Otkazana';
        case MatchStatus.Paused:
            return 'Pauza';
        default:
            return 'Zakazana';
    }
};

export const matchStatusColor = (status: MatchStatus) => {
    switch (status) {
        case MatchStatus.Live:
            return 'success';
        case MatchStatus.Finished:
            return 'default';
        case MatchStatus.Canceled:
            return 'error';
        case MatchStatus.Paused:
            return 'warning';
        default:
            return 'warning';
    }
};
