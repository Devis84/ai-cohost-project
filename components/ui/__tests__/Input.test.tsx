import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input', () => {
  // --- Rendering ---

  it('renders an input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with placeholder text', () => {
    render(<Input placeholder="Enter value" />)
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument()
  })

  it('renders with a label when label prop is provided', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders error message when error prop is provided', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
  })

  it('does not render error element when no error', () => {
    render(<Input />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // --- Design tokens ---

  it('applies min-height of 56px', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[56px]')
  })

  it('applies rounded-2xl styling', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toHaveClass('rounded-2xl')
  })

  it('applies focus ring accent class', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toHaveClass('focus:ring-accent')
  })

  // --- Interaction ---

  it('calls onChange when user types', async () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'hello')
    expect(handleChange).toHaveBeenCalled()
  })

  it('reflects controlled value', () => {
    render(<Input value="test value" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('test value')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  // --- Accessibility ---

  it('associates label with input via htmlFor/id', () => {
    render(<Input label="Username" id="username" />)
    const input = screen.getByLabelText('Username')
    expect(input).toHaveAttribute('id', 'username')
  })

  it('marks input as required when required prop is true', () => {
    render(<Input required />)
    expect(screen.getByRole('textbox')).toBeRequired()
  })

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Invalid input" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('passes through type attribute', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('passes through additional className', () => {
    render(<Input className="extra-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('extra-class')
  })

  it('renders required asterisk when label and required are both provided', () => {
    render(<Input label="Email" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not render asterisk when label is provided but required is false', () => {
    render(<Input label="Email" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  // --- Edge cases ---

  it('handles empty string value', () => {
    render(<Input value="" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('handles special characters in placeholder', () => {
    render(<Input placeholder="Enter your email@domain.com" />)
    expect(screen.getByPlaceholderText('Enter your email@domain.com')).toBeInTheDocument()
  })
})
