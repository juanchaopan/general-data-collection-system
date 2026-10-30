import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('任务窗格外壳', () => {
  it('显示系统名称', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'General Data Collection System' }),
    ).toBeInTheDocument();
  });
});
