import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardHeader } from '../DashboardHeader'

describe('DashboardHeader', () => {
  // --- Rendering ---

  it('renders the title', () => {
    render(<DashboardHeader title="My Properties" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Properties')
  })

  it('renders description when provided', () => {
    render(<DashboardHeader title="Test" description="Manage your properties" />)
    expect(screen.getByText('Manage your properties')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<DashboardHeader title="Test" />)
    expect(screen.queryByText('Manage your properties')).not.toBeInTheDocument()
  })

  // --- Eyebrow ---

  it('renders eyebrow text when provided', () => {
    render(<DashboardHeader title="Test" eyebrow="OVERVIEW" />)
    expect(screen.getByText('OVERVIEW')).toBeInTheDocument()
  })

  it('applies uppercase and letter-spacing to eyebrow', () => {
    render(<DashboardHeader title="Test" eyebrow="OVERVIEW" />)
    const eyebrow = screen.getByText('OVERVIEW')
    expect(eyebrow.className).toMatch(/uppercase/)
    expect(eyebrow.className).toMatch(/tracking-/)
  })

  it('does not render eyebrow element when not provided', () => {
    render(<DashboardHeader title="Test" />)
    expect(screen.queryByText('OVERVIEW')).not.toBeInTheDocument()
  })

  // --- Stats ---

  it('renders stat labels when provided', () => {
    render(
      <DashboardHeader
        title="Test"
        stats={[
          { label: 'Properties', value: '3' },
          { label: 'Guests', value: '12' },
        ]}
      />
    )
    expect(screen.getByText('Properties')).toBeInTheDocument()
    expect(screen.getByText('Guests')).toBeInTheDocument()
  })

  it('renders stat values when provided', () => {
    render(
      <DashboardHeader
        title="Test"
        stats={[{ label: 'Properties', value: '3' }]}
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders multiple stats', () => {
    render(
      <DashboardHeader
        title="Test"
        stats={[
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
          { label: 'C', value: '3' },
        ]}
      />
    )
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('does not render stats section when stats is empty', () => {
    render(<DashboardHeader title="Test" stats={[]} />)
    expect(screen.queryByText('Properties')).not.toBeInTheDocument()
  })

  it('does not render stats section when stats is not provided', () => {
    render(<DashboardHeader title="Test" />)
    // No stat values rendered
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })

  // --- Design tokens ---

  it('uses gradient background with inverse-surface and primary tokens', () => {
    render(<DashboardHeader title="Test" data-testid="header" />)
    const header = screen.getByTestId('header')
    expect(header.className).toMatch(/from-inverse-surface/)
    expect(header.className).toMatch(/to-primary/)
  })

  it('no hardcoded gray or black color classes on header', () => {
    render(<DashboardHeader title="Test" data-testid="header" />)
    const header = screen.getByTestId('header')
    expect(header.className).not.toMatch(/\bgray-\d+\b/)
    expect(header.className).not.toMatch(/\bblack\b/)
  })

  it('applies large text to title (text-4xl or larger)', () => {
    render(<DashboardHeader title="Test" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.className).toMatch(/text-4xl|text-5xl/)
  })

  it('applies font-bold to title', () => {
    render(<DashboardHeader title="Test" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.className).toMatch(/font-bold/)
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(<DashboardHeader title="Test" className="extra-class" data-testid="header" />)
    expect(screen.getByTestId('header')).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders with only required title prop', () => {
    render(<DashboardHeader title="Minimal" />)
    expect(screen.getByText('Minimal')).toBeInTheDocument()
  })

  it('renders with special characters in title', () => {
    render(<DashboardHeader title="Properties & Stays" />)
    expect(screen.getByText('Properties & Stays')).toBeInTheDocument()
  })

  it('renders with long title', () => {
    const longTitle = 'This is a very long dashboard header title'
    render(<DashboardHeader title={longTitle} />)
    expect(screen.getByText(longTitle)).toBeInTheDocument()
  })

  it('renders zero value stats', () => {
    render(
      <DashboardHeader
        title="Test"
        stats={[{ label: 'Pending', value: '0' }]}
      />
    )
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
