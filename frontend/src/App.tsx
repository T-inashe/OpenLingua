
// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/landingPage';
import SignIn from './components/auth/signIn'
import SignUp from './components/auth/signUp';
import CourseDashboard from './components/course/courseDashboard';
import Dashboard from './components/pages/dashboard';
import CourseCreation from './components/course/courseCreation';
import CommunityDashboard from './components/community/communityDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { ProAlertProvider } from './context/ProAlertContext';

function App() {
  return (
    <ThemeProvider>
      <ProAlertProvider>
        <BrowserRouter>
          <Routes>
          {/* <Route path="/" element={<LandingPage />} /> */}
            <Route path="/signIn" element={<SignIn />} />
            <Route path="/signUp" element={<SignUp />}/>
            <Route path="/community" element={<CommunityDashboard />}/>
            <Route path="/create/:id" element={<CourseCreation/>} />
            <Route path="/course/:id" element={<CourseDashboard />} />
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/" element={<LandingPage/>} />
          </Routes>
        </BrowserRouter>
      </ProAlertProvider>
    </ThemeProvider>
  );
}

export default App;
