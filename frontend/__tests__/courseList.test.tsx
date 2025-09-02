import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseList from '../src/components/courseList';

describe('CourseList', () => {
  it('renders list container', () => {
    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/My Courses/i).length).toBeGreaterThan(0);
  });
});


