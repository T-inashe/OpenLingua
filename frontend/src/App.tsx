import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserForm from './components/userForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
