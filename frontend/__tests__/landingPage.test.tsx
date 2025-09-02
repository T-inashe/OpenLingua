import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../src/components/landingPage';

describe('LandingPage', () => {
  it('renders hero content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/OpenLingua/i).length).toBeGreaterThan(0);
  });
});


