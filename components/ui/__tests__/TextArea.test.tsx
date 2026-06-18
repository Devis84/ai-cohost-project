import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextArea } from '../TextArea'

describe('TextArea', () => {
  // --- Rendering ---

  it('renders a textarea element', () => {
    render(<TextArea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders textarea not an input', () => {
    render(<TextArea />)
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })

  it('renders with placeholder text', () => {
    render(<TextArea placeholder="Enter description" />)
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('renders with a label when label prop is provided', () => {
    render(<TextArea label="Notes" />)
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('renders error message when error prop is provided', () => {
    render(<TextArea error="Field is required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Field is required')
  })

  it('does not render error element when no error', () => {
    render(<TextArea />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // --- Design tokens ---

  it('applies rounded-2xl styling', () => {
    render(<TextArea />)
    expect(screen.getByRole('textbox')).toHaveClass('rounded-2xl')
  })

  it('applies default min-height', () => {
    render(<TextArea />)
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[180px]')
  })

  it('applies custom minHeight when provided', () => {
    render(<TextArea minHeight="min-h-[240px]" />)
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[240px]')
  })

  it('applies focus ring accent class', () => {
    render(<TextArea />)
    expect(screen.getByRole('textbox')).toHaveClass('focus:ring-accent')
  })

  // --- Interaction ---

  it('calls onChange when user types', async () => {
    const handleChange = vi.fn()
    render(<TextArea onChange={handleChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'hello')
    expect(handleChange).toHaveBeenCalled()
  })

  it('reflects controlled value', () => {
    render(<TextArea value="existing content" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('existing content')
  })

  it('is disabled when disabled prop is true', () => {
    render(<TextArea disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  // --- Accessibility ---

  it('associates label with textarea via htmlFor/id', () => {
    render(<TextArea label="Description" id="description" />)
    const textarea = screen.getByLabelText('Description')
    expect(textarea).toHaveAttribute('id', 'description')
  })

  it('sets aria-invalid when error is present', () => {
    render(<TextArea error="Invalid input" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('passes rows attribute through', () => {
    render(<TextArea rows={8} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8')
  })

  it('passes through additional className', () => {
    render(<TextArea className="extra-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('extra-class')
  })

  it('renders required asterisk when label and required are both provided', () => {
    render(<TextArea label="Notes" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not render asterisk when label is provided but required is false', () => {
    render(<TextArea label="Notes" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  // --- Edge cases ---

  it('handles empty string value', () => {
    render(<TextArea value="" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('handles multi-line content', async () => {
    const handleChange = vi.fn()
    render(<TextArea onChange={handleChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'line one{enter}line two')
    expect(handleChange).toHaveBeenCalled()
  })
})
