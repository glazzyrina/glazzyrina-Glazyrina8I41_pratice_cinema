import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Главный маршрут, который открывает Афишу */}
        <Route path="/" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;