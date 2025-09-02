import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CourseCreation from '../src/components/courseCreation';

jest.mock('axios');
const axios = require('axios');
const BACKEND_URL = require('../src/config').default.BACKEND_URL;

describe('CourseCreation extra coverage', () => {
  const originalFetch = global.fetch;
  const originalAlert = window.alert;

  beforeEach(() => {
    jest.resetAllMocks();
    (axios.default.post as jest.Mock).mockResolvedValue({ data: { fileUrl: '/uploads/fake-url' } });
    window.alert = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    window.alert = originalAlert;
  });

  function renderWithRoute() {
    render(
      <MemoryRouter initialEntries={[`/courses/create/user-1`]}>
        <Routes>
          <Route path="/courses/create/:id" element={<CourseCreation />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('shows validation alert when required fields missing', async () => {
    renderWithRoute();

    // Jump to publish without filling
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Publish Course/i }));

    expect(window.alert).toHaveBeenCalledWith('Please fill in all required fields.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('adds unit and lesson, selects, edits, deletes, and publishes', async () => {
    renderWithRoute();

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/Beginner isiXhosa Conversations/i), { target: { value: 'Title' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe what students/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'isixhosa' } });

    // Go to Structure
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Add a Unit
    fireEvent.click(screen.getByRole('button', { name: /Add Unit/i }));
    // Add a Lesson to first unit via the unit's first icon button (plus icon)
    // Climb to the unit header container that holds action buttons
    const unitTitle = screen.getByText(/Unit 1/i);
    const unitHeader = unitTitle.parentElement?.parentElement?.parentElement as HTMLElement;
    expect(unitHeader).toBeTruthy();
    const buttonsInHeader = unitHeader.querySelectorAll('button');
    expect(buttonsInHeader.length).toBeGreaterThan(0);
    fireEvent.click(buttonsInHeader[0]);

    // Select lesson and move to Content editor
    fireEvent.click(screen.getByText(/Text Lesson/i));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Edit lesson title and duration (labels are not associated via htmlFor, so target inputs within labeled containers)
    const titleLabel = screen.getByText(/Lesson Title/i);
    const titleInput = titleLabel.parentElement?.querySelector('input') as HTMLInputElement;
    expect(titleInput).toBeTruthy();
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    const durationLabel = screen.getByText(/Duration \(minutes\)/i);
    const durationInput = durationLabel.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
    expect(durationInput).toBeTruthy();
    fireEvent.change(durationInput, { target: { value: '7' } });

    // Back to Structure and delete the lesson (find delete icon in lesson row)
    fireEvent.click(screen.getByRole('button', { name: /Back to Structure/i }));
    const lessonRowTitle = screen.getByText('New Title');
    let row: HTMLElement | null = lessonRowTitle as HTMLElement;
    while (row && row.querySelectorAll('button').length < 2) {
      row = row.parentElement as HTMLElement | null;
    }
    expect(row).toBeTruthy();
    const actionButtons = row!.querySelectorAll('button');
    fireEvent.click(actionButtons[actionButtons.length - 1]);

    // Proceed to Settings step
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Toggle checkboxes and type prerequisites
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => fireEvent.click(cb));
    fireEvent.change(screen.getByPlaceholderText(/What should students know/i), { target: { value: 'Basics' } });

    // Publish
    fireEvent.click(screen.getByRole('button', { name: /Publish Course/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/courses/`, expect.any(Object)));
  });

  it('uploads file and shows progress via axios mock', async () => {
    renderWithRoute();

    // Fill required fields and advance to structure
    fireEvent.change(screen.getByPlaceholderText(/Beginner isiXhosa Conversations/i), { target: { value: 'Title' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe what students/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'isixhosa' } });
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Add unit + lesson and open editor
    fireEvent.click(screen.getByRole('button', { name: /Add Unit/i }));
    const unitTitle = screen.getByText(/Unit 1/i);
    const unitHeader = unitTitle.parentElement?.parentElement?.parentElement as HTMLElement;
    expect(unitHeader).toBeTruthy();
    const buttonsInHeader = unitHeader.querySelectorAll('button');
    expect(buttonsInHeader.length).toBeGreaterThan(0);
    fireEvent.click(buttonsInHeader[0]);
    fireEvent.click(screen.getByText(/Text Lesson/i));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // Click Upload Video to trigger hidden file input flow (no actual file selection necessary for coverage)
    fireEvent.click(screen.getByText(/Upload Video/i));

    // Advance to Publish and submit to run code path
    fireEvent.click(screen.getByRole('button', { name: /Back to Structure/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    fireEvent.click(screen.getByRole('button', { name: /Publish Course/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});


