import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveBar } from '../SaveBar'

describe('SaveBar', () => {
  // --- Rendering ---

  it('renders the save button', () => {
    render(<SaveBar propertyName="Villa Roma" isSaving={false} onSave={() => {}} />)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('renders the property name', () => {
    render(<SaveBar propertyName="Villa Roma" isSaving={false} onSave={() => {}} />)
    expect(screen.getByText('Villa Roma')).toBeInTheDocument()
  })

  it('shows "No property selected" when propertyName is empty', () => {
    render(<SaveBar propertyName="" isSaving={false} onSave={() => {}} />)
    expect(screen.getByText('No property selected')).toBeInTheDocument()
  })

  it('shows "No property selected" when propertyName is undefined-like empty', () => {
    render(<SaveBar propertyName={''} isSaving={false} onSave={() => {}} />)
    expect(screen.getByText('No property selected')).toBeInTheDocument()
  })

  // --- Saving state ---

  it('shows "Saving..." when isSaving is true', () => {
    render(<SaveBar propertyName="Villa Roma" isSaving onSave={() => {}} />)
    expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument()
  })

  it('shows "Changes are ready to be saved" when isSaving is false', () => {
    render(<SaveBar propertyName="Villa Roma" isSaving={false} onSave={() => {}} />)
    expect(screen.getByText(/changes are ready to be saved/i)).toBeInTheDocument()
  })

  it('save button is disabled when isSaving is true', () => {
    render(<SaveBar propertyName="Villa Roma" isSaving onSave={() => {}} />)
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('save button is enabled when isSaving is false', () => {
    render(<SaveBar propertyName="Villa Roma" isSaving={false} onSave={() => {}} />)
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
  })

  // --- Positioning ---

  it('applies fixed positioning at bottom', () => {
    render(
      <SaveBar
        propertyName="Test"
        isSaving={false}
        onSave={() => {}}
        data-testid="savebar"
      />
    )
    const bar = screen.getByTestId('savebar')
    expect(bar.className).toMatch(/fixed/)
    expect(bar.className).toMatch(/bottom-/)
  })

  it('applies bg-primary background', () => {
    render(
      <SaveBar
        propertyName="Test"
        isSaving={false}
        onSave={() => {}}
        data-testid="savebar"
      />
    )
    const bar = screen.getByTestId('savebar')
    expect(bar.className).toMatch(/bg-primary/)
  })

  it('applies text-on-primary', () => {
    render(
      <SaveBar
        propertyName="Test"
        isSaving={false}
        onSave={() => {}}
        data-testid="savebar"
      />
    )
    const bar = screen.getByTestId('savebar')
    expect(bar.className).toMatch(/text-on-primary/)
  })

  it('applies high z-index', () => {
    render(
      <SaveBar
        propertyName="Test"
        isSaving={false}
        onSave={() => {}}
        data-testid="savebar"
      />
    )
    const bar = screen.getByTestId('savebar')
    expect(bar.className).toMatch(/z-50/)
  })

  // --- Save button design tokens ---

  it('save button uses bg-surface-container-lowest', () => {
    render(<SaveBar propertyName="Test" isSaving={false} onSave={() => {}} />)
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn.className).toMatch(/bg-surface-container-lowest/)
  })

  it('save button uses text-on-surface', () => {
    render(<SaveBar propertyName="Test" isSaving={false} onSave={() => {}} />)
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn.className).toMatch(/text-on-surface/)
  })

  // --- No hardcoded colors ---

  it('does not use hardcoded gray or white classes on outer bar', () => {
    render(
      <SaveBar
        propertyName="Test"
        isSaving={false}
        onSave={() => {}}
        data-testid="savebar"
      />
    )
    const bar = screen.getByTestId('savebar')
    expect(bar.className).not.toMatch(/\bgray-\d+\b/)
  })

  // --- Interaction ---

  it('calls onSave when save button is clicked', async () => {
    const handleSave = vi.fn()
    render(<SaveBar propertyName="Test" isSaving={false} onSave={handleSave} />)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(handleSave).toHaveBeenCalledTimes(1)
  })

  it('does not call onSave when isSaving is true', async () => {
    const handleSave = vi.fn()
    render(<SaveBar propertyName="Test" isSaving onSave={handleSave} />)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(handleSave).not.toHaveBeenCalled()
  })

  // --- className passthrough ---

  it('merges additional className', () => {
    render(
      <SaveBar
        propertyName="Test"
        isSaving={false}
        onSave={() => {}}
        className="extra-class"
        data-testid="savebar"
      />
    )
    expect(screen.getByTestId('savebar')).toHaveClass('extra-class')
  })

  // --- Edge cases ---

  it('renders with very long property name', () => {
    const longName = 'Villa '.repeat(20).trim()
    render(<SaveBar propertyName={longName} isSaving={false} onSave={() => {}} />)
    expect(screen.getByText(longName)).toBeInTheDocument()
  })

  it('renders with special characters in property name', () => {
    render(
      <SaveBar propertyName="Maison & Jardin — Paris" isSaving={false} onSave={() => {}} />
    )
    expect(screen.getByText('Maison & Jardin — Paris')).toBeInTheDocument()
  })
})
