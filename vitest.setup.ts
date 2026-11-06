import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Permite importar módulos server-only nos testes do Vitest
vi.mock('server-only', () => ({}));
