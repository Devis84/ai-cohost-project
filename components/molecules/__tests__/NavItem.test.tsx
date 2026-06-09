import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavItem } from '../NavItem'

describe('NavItem', () => {
  // --- Rendering as anchor ---

  it('renders as an anchor when href is provided', () => {
    render(<NavItem label="Dashboard" href="/dashboard" />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('anchor has the correct href', () => {
    render(<NavItem label="Properties" href="/properties" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/properties')
  })

  // --- Rendering as button ---

  it('renders as a button when onClick is provided', () => {
    render(<NavItem label="Logout" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
  })

  it('renders as a button when neither href nor onClick is provided', () => {
    render(<NavItem label="Static Item" />)
    expect(screen.getByRole('button', { name: 'Static Item' })).toBeInTheDocument()
  })

  // --- Label ---

  it('renders the label text', () => {
    render(<NavItem label="My Label" />)
    expect(screen.getByText('My Label')).toBeInTheDocument()
  })

  // --- Icon ---

  it('renders icon when provided', () => {
    render(<NavItem label="Home" icon="🏠" />)
    expect(screen.getByText('🏠')).toBeInTheDocument()
  })

  it('does not render icon container when icon is not provided', () => {
    render(<NavItem label="No Icon" />)
    expect(screen.queryByText('🏠')).not.toBeInTheDocument()
  })

  // --- Active state ---

  it('applies active styles when isActive is true', () => {
    render(<NavItem label="Active" isActive />)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/bg-primary/)
    expect(el.className).toMatch(/text-on-primary/)
  })

  it('does not apply active styles when isActive is false', () => {
    render(<NavItem label="Inactive" isActive={false} />)
    const el = screen.getByRole('button')
    expect(el.className).not.toMatch(/bg-primary\b/)
  })

  // --- Variants ---

  it('default variant applies bg-surface-container-lowest', () => {
    render(<NavItem label="Item" variant="default" />)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/bg-surface-container-lowest/)
  })

  it('default variant applies border outline token', () => {
    render(<NavItem label="Item" />)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/border-outline/)
  })

  it('default variant applies text-on-surface', () => {
    render(<NavItem label="Item" />)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/text-on-surface/)
  })

  it('danger variant applies text-error', () => {
    render(<NavItem label="Delete" variant="danger" />)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/text-error/)
  })

  it('danger variant applies border-error/20', () => {
    render(<NavItem label="Delete" variant="danger" />)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/border-error/)
  })

  // --- No hardcoded colors ---

  it('does not use hardcoded gray classes', () => {
    render(<NavItem label="Item" />)
    const el = screen.getByRole('button')
    expect(el.className).not.toMatch(/\bgray-\d+\b/)
  })

  // --- Base classes ---

  it('applies rounded-2xl to all variants', () => {
    render(<NavItem label="Item" />)
    expect(screen.getByRole('button')).toHaveClass('rounded-2xl')
  })

  it('applies full-width class', () => {
    render(<NavItem label="Item" />)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  // --- Interaction ---

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<NavItem label="Click me" onClick={handleClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not throw when no onClick and clicked', async () => {
    render(<NavItem label="No handler" />)
    await userEvent.click(screen.getByRole('button'))
    // Should not throw
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(<NavItem label="Item" className="extra-class" />)
    expect(screen.getByRole('button')).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders with special characters in label', () => {
    render(<NavItem label="Settings & Preferences" />)
    expect(screen.getByText('Settings & Preferences')).toBeInTheDocument()
  })

  it('renders with long label text', () => {
    const longLabel = 'This is a very long navigation item label'
    render(<NavItem label={longLabel} />)
    expect(screen.getByText(longLabel)).toBeInTheDocument()
  })

  it('active state overrides default variant background', () => {
    render(<NavItem label="Active" isActive variant="default" />)
    const el = screen.getByRole('button')
    expect(el.className).toMatch(/bg-primary/)
  })
})
