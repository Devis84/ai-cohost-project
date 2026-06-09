import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card', () => {
  // --- Rendering ---

  it('renders children content', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders as a div by default', () => {
    render(<Card data-testid="card">Content</Card>)
    expect(screen.getByTestId('card').tagName).toBe('DIV')
  })

  // --- Variants ---

  it('applies white elevated variant styles by default', () => {
    render(<Card data-testid="card">Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('bg-surface-container-lowest')
    expect(card).toHaveClass('shadow-xl')
  })

  it('applies sand structural variant styles', () => {
    render(<Card variant="sand" data-testid="card">Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('bg-surface')
  })

  it('applies rounded-[32px] to all variants', () => {
    render(<Card data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('rounded-[32px]')
  })

  it('applies p-8 padding by default', () => {
    render(<Card data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('p-8')
  })

  // --- Custom padding ---

  it('applies custom padding class when provided', () => {
    render(<Card padding="p-6" data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('p-6')
  })

  // --- Border ---

  it('applies border when border prop is true', () => {
    render(<Card border data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('border')
  })

  it('does not apply border by default', () => {
    render(<Card data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).not.toHaveClass('border')
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(<Card className="extra-class" data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders complex children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Paragraph</p>
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
  })

  it('renders with no children', () => {
    render(<Card data-testid="card" />)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })
})
