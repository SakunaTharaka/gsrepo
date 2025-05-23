import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useLocation
} from 'react-router-dom';
import { 
  CircularProgress,
  Typography,
  Button 
} from '@mui/material';
import Homepage from './pages/Homepage';
import AdminConfig from './pages/AdminConfig';
import AddWhatsappGroup from './pages/AddWhatsappGrp';
import AddTelegramGroup from './pages/AddTelegramGrp';
import Login from './pages/Login';
import ViewGroup from './pages/ViewGroup'; // Add this import
import './App.css';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/viewgroup/:platform/:groupId" element={<ViewGroup />} /> {/* Add this route */}
          <Route path="/login" element={<Login />} />
          <Route path="/add-whatsapp-group" element={<AddWhatsappGroup />} />
          <Route path="/add-telegram-group" element={<AddTelegramGroup />} />

          {/* Protected Admin Route */}
          <Route 
            path="/admin-config" 
            element={
              <ProtectedRoute>
                <AdminConfig />
              </ProtectedRoute>
            } 
          />

          {/* Handle 404 - Not Found */}
          <Route 
            path="*" 
            element={
              <main className="not-found-container">
                <Typography variant="h4">404 - Page Not Found</Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => window.location.href = '/'}
                  sx={{ mt: 2 }}
                >
                  Return Home
                </Button>
              </main>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;