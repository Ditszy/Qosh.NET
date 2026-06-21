import { MatchStatus, MatchType } from '../types';

export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
};

export const formatDateTime = (date: string | Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}. ${hours}:${minutes}`;
};

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
