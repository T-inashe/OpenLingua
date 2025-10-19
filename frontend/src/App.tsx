
// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp';
import CourseDashboard from './components/course/CourseDashboard';
import Dashboard from './components/dashboard';
import CourseCreation from './components/course/CourseCreation';
import CommunityDashboard from './components/community/CommunityDashboard';
import QuizTaker from './components/quiz/QuizTaker';
import QuizResults from './components/quiz/QuizResults';
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
            <Route path="/login" element={<SignIn />} />
            <Route path="/signUp" element={<SignUp />}/>
            <Route path="/community" element={<CommunityDashboard />}/>
            <Route path="/create/:id" element={<CourseCreation/>} />
            <Route path="/course/:id" element={<CourseDashboard />} />
            <Route path="/courses/:courseId/quiz/:quizId/take" element={<QuizTaker />} />
            <Route path="/courses/:courseId/quiz/:quizId/results" element={<QuizResults />} />
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/" element={<LandingPage/>} />
          </Routes>
        </BrowserRouter>
      </ProAlertProvider>
    </ThemeProvider>
  );
}

export default App;
