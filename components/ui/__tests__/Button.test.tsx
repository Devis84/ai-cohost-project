import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button', () => {
  // --- Rendering ---

  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders as a button element by default', () => {
    render(<Button>Submit</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  // --- Variants ---

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-primary')
    expect(btn).toHaveClass('text-on-primary')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-surface-container-high')
    expect(btn).toHaveClass('text-on-surface')
  })

  it('applies ai-action variant classes', () => {
    render(<Button variant="ai-action">AI</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-accent')
  })

  it('applies pill shape (rounded-full) to all variants', () => {
    render(<Button>Pill</Button>)
    expect(screen.getByRole('button')).toHaveClass('rounded-full')
  })

  // --- Sizes ---

  it('applies medium size classes by default', () => {
    render(<Button>Medium</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('px-6')
    expect(btn).toHaveClass('py-3')
  })

  it('applies small size classes', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('px-4')
    expect(btn).toHaveClass('py-2')
  })

  it('applies large size classes', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('px-8')
    expect(btn).toHaveClass('py-4')
  })

  // --- Interaction ---

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('has disabled attribute when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies disabled opacity styling when disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50')
  })

  // --- Accessibility ---

  it('passes through aria-label', () => {
    render(<Button aria-label="Submit form">Submit</Button>)
    expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument()
  })

  it('passes through type attribute', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('passes through additional className', () => {
    render(<Button className="extra-class">Extra</Button>)
    expect(screen.getByRole('button')).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders with empty children', () => {
    render(<Button>{''}</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders with null children gracefully', () => {
    render(<Button>{null}</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
