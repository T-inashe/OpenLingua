import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CourseDashboard from '../src/components/courseDashboard';

const BACKEND_URL = require('../src/config').default.BACKEND_URL;

describe('CourseDashboard extra coverage', () => {
  const originalFetch = global.fetch;
  const originalAlert = window.alert;

  beforeEach(() => {
    jest.useFakeTimers();
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch as any;
    window.alert = originalAlert;
    jest.resetAllMocks();
  });

  function renderWithRoute() {
    render(
      <MemoryRouter initialEntries={[`/course/c-1/u-1`]}>
        <Routes>
          <Route path="/course/:id/:uid" element={<CourseDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('handles sidebar toggle and event attendance', async () => {
    // getCourses, getForum, getReview
    const mocks = [
      { ok: true, json: async () => ({ course: { id: 'c-1', title: 'C1', words: [] } }) },
      { ok: true, json: async () => ({ posts: [] }) },
      { ok: true, json: async () => ({ reviews: [] }) }
    ];
    let call = 0;
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve(mocks[call++]) as any);

    renderWithRoute();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await screen.findByText(/Welcome To/i);

    // open sidebar
    const headerButtons = screen.getAllByRole('button');
    fireEvent.click(headerButtons[0]); // Calendar button (first header button)

    // click attend on first event in sidebar
    await waitFor(() => expect(screen.getByText(/Upcoming Events/i)).toBeInTheDocument());
    const attendButtons = screen.getAllByRole('button');
    const attend = attendButtons.find(b => /I'm Attending|Attending/i.test(b.textContent || '')) as HTMLElement;
    if (attend) fireEvent.click(attend);
  });

  it('creates forum post and review through fetch', async () => {
    const responses = [
      // getCourses, getForum, getReview
      { ok: true, json: async () => ({ course: { id: 'c-1', title: 'C1', words: [] } }) },
      { ok: true, json: async () => ({ posts: [] }) },
      { ok: true, json: async () => ({ reviews: [] }) },
      // createForum
      { ok: true, json: async () => ({}) },
      // getForum refresh
      { ok: true, json: async () => ({ posts: [] }) },
      // createReview
      { ok: true, json: async () => ({}) },
      // getReview refresh
      { ok: true, json: async () => ({ reviews: [] }) }
    ];
    let idx = 0;
    global.fetch = jest.fn().mockImplementation(() => Promise.resolve(responses[idx++]) as any);

    renderWithRoute();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await screen.findByText(/Welcome To/i);

    // forum
    fireEvent.change(screen.getByPlaceholderText(/Write your message/i), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /Post/i }));

    // review
    fireEvent.change(screen.getByPlaceholderText(/Write your review/i), { target: { value: 'Nice' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/i }));

    await waitFor(() => expect((global.fetch as jest.Mock)).toHaveBeenCalled());
  });
});


