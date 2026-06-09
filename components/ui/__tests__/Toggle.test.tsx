import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from '../Toggle'

describe('Toggle', () => {
  // --- Rendering ---

  it('renders with a label', () => {
    render(<Toggle label="AI Concierge" checked={false} onChange={vi.fn()} />)
    expect(screen.getByText('AI Concierge')).toBeInTheDocument()
  })

  it('renders a checkbox input underneath', () => {
    render(<Toggle label="Feature" checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  // --- Checked state ---

  it('reflects checked state when checked is true', () => {
    render(<Toggle label="Feature" checked={true} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('reflects unchecked state when checked is false', () => {
    render(<Toggle label="Feature" checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  // --- Interaction ---

  it('calls onChange when clicked', async () => {
    const handleChange = vi.fn()
    render(<Toggle label="Feature" checked={false} onChange={handleChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('passes the new checked value to onChange', async () => {
    const handleChange = vi.fn()
    render(<Toggle label="Feature" checked={false} onChange={handleChange} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('does not call onChange when disabled', async () => {
    const handleChange = vi.fn()
    render(<Toggle label="Feature" checked={false} onChange={handleChange} disabled />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(handleChange).not.toHaveBeenCalled()
  })

  // --- Accessibility ---

  it('associates label with checkbox via accessible name', () => {
    render(<Toggle label="AI Concierge" checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox', { name: 'AI Concierge' })).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Toggle label="Feature" checked={false} onChange={vi.fn()} disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  // --- Visual indicator ---

  it('renders a visual track element', () => {
    render(<Toggle label="Feature" checked={false} onChange={vi.fn()} data-testid="toggle" />)
    // The toggle should have visual track styling
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.parentElement).toBeTruthy()
  })

  // --- className passthrough ---

  it('merges additional className on wrapper', () => {
    render(
      <Toggle
        label="Feature"
        checked={false}
        onChange={vi.fn()}
        className="extra-class"
        data-testid="toggle-wrapper"
      />
    )
    const wrapper = screen.getByRole('checkbox').closest('label')
    expect(wrapper).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders with empty label', () => {
    render(<Toggle label="" checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('renders with long label text', () => {
    const longLabel = 'Enable Advanced AI Features for Property Management'
    render(<Toggle label={longLabel} checked={false} onChange={vi.fn()} />)
    expect(screen.getByText(longLabel)).toBeInTheDocument()
  })
})
