// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landingPage';
import SignIn from './components/signIn'
import SignUp from './components/signUp';
import CourseList from './components/courseList';
import CreateCourse from './components/createCourse';
import CourseDashboard from './components/courseDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signIn" element={<SignIn />} />
        <Route path="/signUp" element={<SignUp />}/>
        <Route path="/dashboard" element={<CourseList />} />
        <Route path="/create" element={<CreateCourse />} />
        <Route path="/course/:id" element={<CourseDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
