import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

import { AuthProvider } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LeaguesPage from './pages/LeaguesPage';
import LeagueDetailsPage from './pages/LeagueDetailsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MatchDetails from './pages/MatchDetails';
import TeamProfilePage from './pages/TeamProfilePage';
import UserInvitesPage from './pages/UserInvitesPage';
import AdminDashboard from './pages/AdminDashboard';
import ScorerMatchesPage from './pages/ScorerMatchesPage';
import ScorerMatchPage from './pages/ScorerMatchPage';
import RefereeMatchesPage from './pages/RefereeMatchesPage';
import RefereeReportPage from './pages/RefereeReportPage';
import PlayerProfilePage from './pages/PlayerProfilePage';
import SettingsPage from './pages/SettingsPage';
import OrganizerLeaguesPage from './pages/OrganizerLeaguesPage';
import RequireRole from './components/RequireRole';
import { UserRole } from './types';

// Tema koja treba da se promeni posle
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/leagues',
    element: <LeaguesPage />,
  },
  {
    path: '/leagues/:leagueId',
    element: <LeagueDetailsPage />,
  },
  {
    path: '/leaderboard',
    element: <LeaderboardPage />,
  },
  {
    path: '/matches/:matchId',
    element: <MatchDetails />,
  },
  {
    path: '/profile/:userId',
    element: <PlayerProfilePage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/team',
    element: (
      <RequireRole roles={[UserRole.Captain, UserRole.Player]}>
        <TeamProfilePage />
      </RequireRole>
    ),
  },
  {
    path: '/invites',
    element: (
      <RequireRole roles={[UserRole.Captain, UserRole.Player]}>
        <UserInvitesPage />
      </RequireRole>
    ),
  },
  {
    path: '/organizer/leagues',
    element: (
      <RequireRole roles={[UserRole.Organizer, UserRole.Admin]}>
        <OrganizerLeaguesPage />
      </RequireRole>
    ),
  },
  {
    path: '/admin',
    element: (
      <RequireRole roles={[UserRole.Admin]}>
        <AdminDashboard />
      </RequireRole>
    ),
  },
  {
    path: '/scorer',
    element: (
      <RequireRole roles={[UserRole.Scorer, UserRole.Admin]}>
        <ScorerMatchesPage />
      </RequireRole>
    ),
  },
  {
    path: '/scorer/matches/:matchId',
    element: (
      <RequireRole roles={[UserRole.Scorer, UserRole.Admin]}>
        <ScorerMatchPage />
      </RequireRole>
    ),
  },
  {
    path: '/referee',
    element: (
      <RequireRole roles={[UserRole.Referee, UserRole.Admin]}>
        <RefereeMatchesPage />
      </RequireRole>
    ),
  },
  {
    path: '/referee/report/:matchId',
    element: (
      <RequireRole roles={[UserRole.Referee, UserRole.Admin]}>
        <RefereeReportPage />
      </RequireRole>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
