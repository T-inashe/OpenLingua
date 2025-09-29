import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CourseDashboard from '../src/components/course/courseDashboard';

const BACKEND_URL = require('../src/config').default.BACKEND_URL;

describe('CourseDashboard coverage', () => {
  const originalFetch = global.fetch;
  const originalAlert = window.alert;
  const originalConsole = { error: console.error, log: console.log };

  beforeEach(() => {
    jest.useFakeTimers();
    window.alert = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch as any;
    window.alert = originalAlert;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
    jest.resetAllMocks();
  });

  function renderWithRoute() {
    render(
      <MemoryRouter initialEntries={[`/course/abc/user-1`]}>
        <Routes>
          <Route path="/course/:id/:uid" element={<CourseDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('loads course, forum, and reviews, and translates input', async () => {
    // Sequence of fetch mocks for getCourses, getForum, getReview, translate
    const mocks = [
      // getCourses
      { ok: true, json: async () => ({ course: { id: 'abc', title: 'Test', words: [{ title: 'Hello', content: 'World', type: 'text' }] } }) },
      // getForum
      { ok: true, json: async () => ({ posts: [] }) },
      // getReview
      { ok: true, json: async () => ({ reviews: [] }) },
      // translate
      { ok: true, json: async () => ({ translatedText: 'Hola' }) }
    ];
    let call = 0;
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve(mocks[call++]) as any);

    renderWithRoute();

    // make visible effect advance
    jest.advanceTimersByTime(200);

    // Course title appears
    await screen.findByText(/Welcome To/i);

    // trigger translate
    fireEvent.change(screen.getByPlaceholderText(/Enter text to translate/i), { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: /Translate/i }));

    await waitFor(() => expect(screen.getByText('Hola')).toBeInTheDocument());
  });
});
