import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { initCoiApp } from '../../assets/js/app/coiExternalStore';
import { App } from '../../src/App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    initCoiApp();
  });

  it('renders the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /resource calculator/i })).toBeDefined();
  });
});
