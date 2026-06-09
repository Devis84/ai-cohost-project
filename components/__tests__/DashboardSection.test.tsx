import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardSection } from '../DashboardSection'

describe('DashboardSection', () => {
  // --- Rendering ---

  it('renders the title', () => {
    render(<DashboardSection title="Property Info">Content</DashboardSection>)
    expect(screen.getByText('Property Info')).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(<DashboardSection title="Test">Hello children</DashboardSection>)
    expect(screen.getByText('Hello children')).toBeInTheDocument()
  })

  it('renders as a section element', () => {
    render(<DashboardSection title="Test" data-testid="section">Content</DashboardSection>)
    expect(screen.getByTestId('section').tagName).toBe('SECTION')
  })

  // --- Subtitle ---

  it('renders subtitle when provided', () => {
    render(
      <DashboardSection title="Test" subtitle="Helpful description">
        Content
      </DashboardSection>
    )
    expect(screen.getByText('Helpful description')).toBeInTheDocument()
  })

  it('does not render subtitle element when not provided', () => {
    render(<DashboardSection title="Test">Content</DashboardSection>)
    expect(screen.queryByText('Helpful description')).not.toBeInTheDocument()
  })

  // --- Icon ---

  it('renders icon when provided', () => {
    render(
      <DashboardSection title="Test" icon="🏠">
        Content
      </DashboardSection>
    )
    expect(screen.getByText('🏠')).toBeInTheDocument()
  })

  it('does not render icon container when icon is not provided', () => {
    render(<DashboardSection title="Test">Content</DashboardSection>)
    expect(screen.queryByText('🏠')).not.toBeInTheDocument()
  })

  // --- Design tokens (no hardcoded colors) ---

  it('uses design token colors in header — no hardcoded gray classes', () => {
    render(
      <DashboardSection title="Test" data-testid="section">
        Content
      </DashboardSection>
    )
    const section = screen.getByTestId('section')
    const classNames = section.className
    expect(classNames).not.toMatch(/\bgray-\d+\b/)
    expect(classNames).not.toMatch(/\bblack\b/)
    expect(classNames).not.toMatch(/\bzinc-\d+\b/)
  })

  it('applies design token text color to title', () => {
    render(<DashboardSection title="Test">Content</DashboardSection>)
    const title = screen.getByRole('heading', { level: 2 })
    expect(title.className).toMatch(/text-on-surface/)
  })

  it('applies design token text color to subtitle', () => {
    render(
      <DashboardSection title="Test" subtitle="Sub">
        Content
      </DashboardSection>
    )
    const subtitle = screen.getByText('Sub')
    expect(subtitle.className).toMatch(/text-outline/)
  })

  // --- Default variant ---

  it('default variant: icon container uses bg-surface-container-high', () => {
    render(
      <DashboardSection title="Test" icon="🏠">
        Content
      </DashboardSection>
    )
    const iconContainer = screen.getByText('🏠').closest('div')
    expect(iconContainer?.className).toMatch(/bg-surface-container-high/)
  })

  // --- AI variant ---

  it('ai variant: icon container uses bg-accent/10', () => {
    render(
      <DashboardSection title="AI Section" icon="🤖" variant="ai">
        Content
      </DashboardSection>
    )
    const iconContainer = screen.getByText('🤖').closest('div')
    expect(iconContainer?.className).toMatch(/bg-accent/)
  })

  it('ai variant: applies border-accent/20 styling', () => {
    render(
      <DashboardSection title="AI Section" variant="ai" data-testid="section">
        Content
      </DashboardSection>
    )
    const section = screen.getByTestId('section')
    // The outer Card/wrapper should have accent border
    expect(section.className).toMatch(/border-accent/)
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(
      <DashboardSection title="Test" className="extra-class" data-testid="section">
        Content
      </DashboardSection>
    )
    expect(screen.getByTestId('section')).toHaveClass('extra-class')
  })

  // --- Complex children ---

  it('renders complex nested children', () => {
    render(
      <DashboardSection title="Test">
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </DashboardSection>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  // --- Edge cases ---

  it('renders with very long title', () => {
    const longTitle = 'A'.repeat(200)
    render(<DashboardSection title={longTitle}>Content</DashboardSection>)
    expect(screen.getByText(longTitle)).toBeInTheDocument()
  })

  it('renders with special characters in title', () => {
    render(<DashboardSection title="Test & <Special>">Content</DashboardSection>)
    expect(screen.getByText('Test & <Special>')).toBeInTheDocument()
  })

  it('renders with empty string subtitle gracefully', () => {
    render(
      <DashboardSection title="Test" subtitle="">
        Content
      </DashboardSection>
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
