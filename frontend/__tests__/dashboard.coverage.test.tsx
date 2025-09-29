import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../src/components/pages/dashboard';

const BACKEND_URL = require('../src/config').default.BACKEND_URL;

describe('Dashboard coverage', () => {
  const originalFetch = global.fetch;
  const originalAlert = window.alert;
  const originalConsoleError = console.error;

  beforeEach(() => {
    window.alert = jest.fn();
    console.error = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch as any;
    window.alert = originalAlert;
    console.error = originalConsoleError;
    jest.resetAllMocks();
  });

  function renderWithRoute() {
    render(
      <MemoryRouter initialEntries={[`/dashboard`]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('loads user, my courses, all courses, joined courses and shows cards', async () => {
    // getUser, getCourses, getJoinedCourses, getMyCourses in various effects
    const mocks = [
      // getUser
      { ok: true, json: async () => ({ user: { id: 'u1', name: 'John Doe', avatar: 'a' } }) },
      // getCourses
      { ok: true, json: async () => ({ courses: [{ id: 'c1', title: 'T', createdAt: new Date().toISOString(), description: 'd', level: 'Beginner' }] }) },
      // getJoinedCourses
      { ok: true, json: async () => ({ courses: [{ id: 'c2', progress: '50%' }] }) },
      // getMyCourses
      { ok: true, json: async () => ({ courses: [{ id: 'c3', title: 'Mine', createdAt: '', description: '', level: 'Beginner' }] }) },
      // CourseCard: getJoinedCoursesCourseid
      { ok: true, json: async () => ({ joinedCourses: [{ id: 'x', progress: '10%' }] }) },
      // CourseCard: getJoinedCoursesUseridCourseid
      { ok: true, json: async () => ({ joined: null }) }
    ];
    let i = 0;
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve(mocks[i++]) as any);

    renderWithRoute();

    // Basic content assertions
    await screen.findByText(/OpenLingua/i);
    await waitFor(() => expect(screen.getByText(/Courses Enrolled/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Courses Created/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Avg Progress/i)).toBeInTheDocument());

    // Should show a course card
    await screen.findByText('T');
  });

  it('handles JoinCourse success flow', async () => {
    // getUser, getCourses, getJoinedCourses, getMyCourses
    const mocks = [
      { ok: true, json: async () => ({ user: { id: 'u1', name: 'John Doe', avatar: 'a' } }) },
      { ok: true, json: async () => ({ courses: [{ id: 'c1', title: 'T', createdAt: new Date().toISOString(), description: 'd', level: 'Beginner' }] }) },
      { ok: true, json: async () => ({ courses: [] }) },
      { ok: true, json: async () => ({ courses: [] }) },
      // CourseCard support calls
      { ok: true, json: async () => ({ joinedCourses: [] }) },
      { ok: true, json: async () => ({ joined: null }) },
      // JoinCourse POST
      { ok: true, json: async () => ({}) }
    ];
    let i = 0;
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve(mocks[i++]) as any);

    renderWithRoute();

    await screen.findByText('T');
    fireEvent.click(screen.getByRole('button', { name: /Enroll/i }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Course joined successfully!'));
  });

  it('handles getCourses non-array branch', async () => {
    const mocks = [
      { ok: true, json: async () => ({ user: { id: 'u1', name: 'John Doe', avatar: 'a' } }) },
      { ok: true, json: async () => ({ courses: {} }) },
      { ok: true, json: async () => ({ courses: [] }) },
      { ok: true, json: async () => ({ courses: [] }) }
    ];
    let i = 0;
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve(mocks[i++]) as any);

    renderWithRoute();

    await screen.findByText(/OpenLingua/i);
    expect(console.error).toHaveBeenCalled();
  });
});
