import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToonButton } from '../ToonButton';
import { Stepper } from '../Stepper';

describe('ToonButton', () => {
  it('renders button text and handles click', () => {
    const handleClick = vi.fn();
    render(<ToonButton onClick={handleClick}>Jogar Agora</ToonButton>);
    const button = screen.getByRole('button', { name: /jogar agora/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders loading state and is disabled', () => {
    render(<ToonButton isLoading>Entrar</ToonButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/carregando.../i)).toBeInTheDocument();
  });
});

describe('Stepper', () => {
  it('increments and decrements value within bounds', () => {
    const handleChange = vi.fn();
    render(<Stepper value={3} min={1} max={5} onChange={handleChange} />);

    const plusButton = screen.getByRole('button', { name: /aumentar/i });
    const minusButton = screen.getByRole('button', { name: /diminuir/i });

    fireEvent.click(plusButton);
    expect(handleChange).toHaveBeenCalledWith(4);

    fireEvent.click(minusButton);
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('disables decrement at min bound', () => {
    render(<Stepper value={1} min={1} max={5} onChange={vi.fn()} />);
    const minusButton = screen.getByRole('button', { name: /diminuir/i });
    expect(minusButton).toBeDisabled();
  });
});
