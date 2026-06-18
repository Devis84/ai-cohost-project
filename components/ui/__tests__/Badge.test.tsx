import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  // --- Rendering ---

  it('renders children text', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders as a span element', () => {
    render(<Badge data-testid="badge">Active</Badge>)
    expect(screen.getByTestId('badge').tagName).toBe('SPAN')
  })

  // --- Pill shape ---

  it('is pill shaped (rounded-full)', () => {
    render(<Badge data-testid="badge">Pill</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('rounded-full')
  })

  // --- Color variants ---

  it('applies default (accent) color styles', () => {
    render(<Badge data-testid="badge">Default</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('text-accent')
  })

  it('applies success color styles', () => {
    render(<Badge color="success" data-testid="badge">Success</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('text-accent')
  })

  it('applies error color styles', () => {
    render(<Badge color="error" data-testid="badge">Error</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('text-error')
  })

  it('applies neutral color styles', () => {
    render(<Badge color="neutral" data-testid="badge">Neutral</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('text-on-surface')
  })

  // --- Sizing ---

  it('applies small size classes', () => {
    render(<Badge size="sm" data-testid="badge">Small</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('text-xs')
  })

  it('applies medium size classes by default', () => {
    render(<Badge data-testid="badge">Medium</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('text-sm')
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(<Badge className="extra-class" data-testid="badge">Extra</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders with empty text', () => {
    render(<Badge data-testid="badge">{''}</Badge>)
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('renders with special characters', () => {
    render(<Badge>{'<Active & Pending>'}</Badge>)
    expect(screen.getByText('<Active & Pending>')).toBeInTheDocument()
  })

  it('renders with unicode characters', () => {
    render(<Badge>{'Активный'}</Badge>)
    expect(screen.getByText('Активный')).toBeInTheDocument()
  })
})
