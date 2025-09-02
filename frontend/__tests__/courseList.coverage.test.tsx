import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseList from '../src/components/courseList';

const BACKEND_URL = require('../src/config').default.BACKEND_URL;

describe('CourseList coverage', () => {
  const originalFetch = global.fetch;
  const originalError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch as any;
    console.error = originalError;
  });

  it('loads and renders courses on success (array path)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ courses: [{ id: '1', title: 'Intro Xhosa' }] })
    } as any);

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/courses/`, expect.any(Object)));
    expect(await screen.findByText('Intro Xhosa')).toBeInTheDocument();
  });

  it('handles non-array response and logs error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ courses: { id: 'weird' } })
    } as any);

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(console.error).toHaveBeenCalled();
    // Should show fallback content when lod !== 'no' or empty
    expect(screen.getByText(/helloooooo/i)).toBeInTheDocument();
  });

  it('handles fetch failure branch', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false } as any);

    render(
      <MemoryRouter>
        <CourseList />
      </MemoryRouter>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(console.error).toHaveBeenCalledWith('Error fetching courses:', expect.any(Error));
  });
});
