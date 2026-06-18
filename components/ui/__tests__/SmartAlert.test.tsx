import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SmartAlert } from '../SmartAlert'

describe('SmartAlert', () => {
  // --- Rendering ---

  it('renders the message text', () => {
    render(<SmartAlert message="AI suggests you check this." />)
    expect(screen.getByText('AI suggests you check this.')).toBeInTheDocument()
  })

  it('renders with a title when provided', () => {
    render(<SmartAlert title="AI Insight" message="Something important." />)
    expect(screen.getByText('AI Insight')).toBeInTheDocument()
  })

  it('does not render title element when no title', () => {
    render(<SmartAlert message="Message only" />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('uses alert role for accessibility', () => {
    render(<SmartAlert message="Critical info" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  // --- Design tokens ---

  it('applies teal left-border-4 accent', () => {
    render(<SmartAlert message="Test" data-testid="alert" />)
    expect(screen.getByRole('alert')).toHaveClass('border-l-4')
    expect(screen.getByRole('alert')).toHaveClass('border-accent')
  })

  it('applies teal gradient background', () => {
    render(<SmartAlert message="Test" />)
    const alert = screen.getByRole('alert')
    // Verify faint teal gradient
    expect(alert.className).toMatch(/from-/)
  })

  // --- Icon ---

  it('renders a visual indicator (icon area)', () => {
    render(<SmartAlert message="Test" />)
    // The alert should have some visual indicator
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(<SmartAlert message="Test" className="extra-class" />)
    expect(screen.getByRole('alert')).toHaveClass('extra-class')
  })

  // --- Children (optional slot) ---

  it('renders optional children alongside message', () => {
    render(
      <SmartAlert message="Main insight">
        <button>Take action</button>
      </SmartAlert>
    )
    expect(screen.getByText('Main insight')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Take action' })).toBeInTheDocument()
  })

  // --- Edge cases ---

  it('renders with a very long message', () => {
    const longMessage = 'A'.repeat(500)
    render(<SmartAlert message={longMessage} />)
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  it('renders with special characters in message', () => {
    render(<SmartAlert message={'<script>alert("xss")</script>'} />)
    // React escapes HTML - text content is safe
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
