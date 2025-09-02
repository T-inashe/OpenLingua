import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseCreation from '../src/components/courseCreation';

const BACKEND_URL = require('../src/config').default.BACKEND_URL;

describe('CourseCreation coverage', () => {
  const originalFetch = global.fetch;
  const originalAlert = window.alert;

  beforeEach(() => {
    global.fetch = jest.fn();
    window.alert = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    window.alert = originalAlert;
    jest.resetAllMocks();
  });

  function renderWithRoute() {
    render(
      <MemoryRouter initialEntries={[`/courses/create/uid-1`]}>
        <Routes>
          <Route path="/courses/create/:id" element={<CourseCreation />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('navigates steps and publishes successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    renderWithRoute();

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/Beginner isiXhosa Conversations/i), { target: { value: 'Title' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe what students/i), { target: { value: 'Desc' } });

    // Set language via first combobox
    const combos = screen.getAllByRole('combobox');
    fireEvent.change(combos[0], { target: { value: 'isixhosa' } });

    // Advance to step 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Publish
    fireEvent.click(screen.getByRole('button', { name: /Publish Course/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/courses/`, expect.any(Object)));
    expect(window.alert).toHaveBeenCalledWith('Course created successfully!');
  });
});
