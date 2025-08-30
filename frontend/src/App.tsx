// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landingPage';
import SignIn from './components/signIn'
import SignUp from './components/signUp';
import Dashboard from './components/dashboard';
import CourseCreation from './components/courseCreation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<LandingPage />} /> */}
        <Route path="/signIn" element={<SignIn />} />
        <Route path="/signUp" element={<SignUp />}/>
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/" element={<CourseCreation/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
