import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { routes } from './routes';

describe('应用外壳', () => {
  it('首页显示系统名称和接口状态', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<App router={createMemoryRouter(routes)} />);
    expect(
      await screen.findByRole('heading', { name: 'General Data Collection System' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('API is reachable.')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
