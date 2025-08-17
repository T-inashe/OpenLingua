// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landingPage';
import UserForm from './components/userForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserForm/>}/>
        <Route path="/landingPage" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
