import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../src/components/pages/dashboard';

describe('Dashboard', () => {
  it('renders dashboard heading', () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/OpenLingua/i)).toBeInTheDocument();
  });
});


