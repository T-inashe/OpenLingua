import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseDashboard from '../src/components/courseDashboard';

describe('CourseDashboard', () => {
  it('renders course dashboard shell', () => {
    render(
      <MemoryRouter initialEntries={["/course/123/456"]}>
        <Routes>
          <Route path="/course/:id/:uid" element={<CourseDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Welcome To/i)).toBeInTheDocument();
  });
});


