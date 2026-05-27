import React, { useState } from 'react';
import Login from './pages/Login';
import { Button, Box, Typography } from '@mui/material';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'dashboard'>('login');

  return (
    <div>
      { }
      {currentPage === 'dashboard' ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            gap: 2
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Cao!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Dobar login.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => setCurrentPage('login')}
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          >
            Izloguj se
          </Button>
        </Box>
      ) : (

        <Login onLoginSuccess={() => setCurrentPage('dashboard')} />
      )}
    </div>
  );
};

export default App;