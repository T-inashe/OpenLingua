import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseCreation from '../src/components/courseCreation';

describe('CourseCreation', () => {
  it('renders creation form elements', () => {
    render(
      <MemoryRouter initialEntries={["/courses/create/123"]}>
        <Routes>
          <Route path="/courses/create/:id" element={<CourseCreation />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Course Info/i)).toBeInTheDocument();
    expect(screen.getByText(/Course Title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next Step/i })).toBeInTheDocument();
  });
});


