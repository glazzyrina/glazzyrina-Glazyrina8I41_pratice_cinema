import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainPage from './pages/MainPage/MainPage';
import AuthPage from './pages/AuthPage/AuthPage';
import AdminPage from './pages/AdminPage/AdminPage';
import SchedulePage from './pages/SchedulePage/SchedulePage';
import HallPage from './pages/HallPage/HallPage';
import CabinetPage from './pages/CabinetPage/CabinetPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/hall" element={<HallPage />} />
        <Route path="/cabinet" element={<CabinetPage />} />
      </Routes>
    </Router>
  );
}

export default App;
