import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '../Select'

const OPTIONS = [
  { value: 'option-1', label: 'Option 1' },
  { value: 'option-2', label: 'Option 2' },
  { value: 'option-3', label: 'Option 3' },
]

describe('Select', () => {
  // --- Rendering ---

  it('renders a select element', () => {
    render(<Select options={OPTIONS} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders all provided options', () => {
    render(<Select options={OPTIONS} />)
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
  })

  it('renders a placeholder option when placeholder prop is provided', () => {
    render(<Select options={OPTIONS} placeholder="Select property" />)
    expect(screen.getByRole('option', { name: 'Select property' })).toBeInTheDocument()
  })

  it('renders placeholder as empty-value option', () => {
    render(<Select options={OPTIONS} placeholder="Choose one" />)
    const placeholderOption = screen.getByRole('option', { name: 'Choose one' })
    expect(placeholderOption).toHaveValue('')
  })

  it('renders with a label when label prop is provided', () => {
    render(<Select options={OPTIONS} label="Property" />)
    expect(screen.getByLabelText('Property')).toBeInTheDocument()
  })

  // --- Design tokens ---

  it('applies rounded-2xl styling', () => {
    render(<Select options={OPTIONS} />)
    expect(screen.getByRole('combobox')).toHaveClass('rounded-2xl')
  })

  it('applies padding p-4', () => {
    render(<Select options={OPTIONS} />)
    expect(screen.getByRole('combobox')).toHaveClass('p-4')
  })

  it('applies white background', () => {
    render(<Select options={OPTIONS} />)
    expect(screen.getByRole('combobox')).toHaveClass('bg-white')
  })

  // --- Controlled value ---

  it('reflects controlled value', () => {
    render(<Select options={OPTIONS} value="option-2" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('option-2')
  })

  // --- Interaction ---

  it('calls onChange when user selects an option', async () => {
    const handleChange = vi.fn()
    render(<Select options={OPTIONS} onChange={handleChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'option-1')
    expect(handleChange).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Select options={OPTIONS} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  // --- Accessibility ---

  it('associates label with select via htmlFor/id', () => {
    render(<Select options={OPTIONS} label="Property" id="property-select" />)
    const select = screen.getByLabelText('Property')
    expect(select).toHaveAttribute('id', 'property-select')
  })

  it('sets aria-invalid when error is present', () => {
    render(<Select options={OPTIONS} error="Please select an option" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders error message when error prop is provided', () => {
    render(<Select options={OPTIONS} error="Please select an option" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Please select an option')
  })

  it('marks select as required when required prop is true', () => {
    render(<Select options={OPTIONS} required />)
    expect(screen.getByRole('combobox')).toBeRequired()
  })

  it('renders required asterisk when label and required are both provided', () => {
    render(<Select options={OPTIONS} label="Property" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not render asterisk when label is provided but required is false', () => {
    render(<Select options={OPTIONS} label="Property" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(<Select options={OPTIONS} className="extra-class" />)
    expect(screen.getByRole('combobox')).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders with empty options array', () => {
    render(<Select options={[]} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders with a single option', () => {
    render(<Select options={[{ value: 'only', label: 'Only Option' }]} />)
    expect(screen.getByRole('option', { name: 'Only Option' })).toBeInTheDocument()
  })

  it('handles options with special characters in labels', () => {
    const specialOptions = [{ value: 'special', label: 'Option & <Test>' }]
    render(<Select options={specialOptions} />)
    expect(screen.getByRole('option', { name: 'Option & <Test>' })).toBeInTheDocument()
  })

  it('renders many options without error', () => {
    const manyOptions = Array.from({ length: 100 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i}`,
    }))
    render(<Select options={manyOptions} />)
    expect(screen.getAllByRole('option')).toHaveLength(100)
  })
})
