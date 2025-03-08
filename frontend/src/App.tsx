import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link
} from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import Chat from './components/Chat';
import AdminDashboard from './components/AdminDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Stack Overflow-style Chatbot
            </Typography>
            <Button color="inherit" component={Link} to="/">
              Chat
            </Button>
            <Button color="inherit" component={Link} to="/admin">
              Admin
            </Button>
          </Toolbar>
        </AppBar>
        
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
