import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './pages/HomePage';
import BonsTravailPage from './pages/BonsTravailPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/accueil" element={<HomePage />} />
        <Route path="/bons-travail" element={<BonsTravailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
