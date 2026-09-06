import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import AuthPage from './pages/AuthPage/AuthPage';
import AdminPage from './pages/AdminPage/AdminPage';
import SchedulePage from './pages/SchedulePage/SchedulePage'; // Добавили импорт

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/schedule" element={<SchedulePage />} /> {/* Добавили маршрут */}
      </Routes>
    </Router>
  );
}

export default App;