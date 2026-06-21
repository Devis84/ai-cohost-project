import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('PWA manifest.json', () => {
  const manifestPath = resolve(__dirname, '../../../public/manifest.json')

  let manifest: Record<string, unknown>

  try {
    const raw = readFileSync(manifestPath, 'utf-8')
    manifest = JSON.parse(raw) as Record<string, unknown>
  } catch {
    manifest = {}
  }

  it('has required name field', () => {
    expect(manifest.name).toBeDefined()
    expect(typeof manifest.name).toBe('string')
    expect((manifest.name as string).length).toBeGreaterThan(0)
  })

  it('has required short_name field', () => {
    expect(manifest.short_name).toBeDefined()
    expect(typeof manifest.short_name).toBe('string')
  })

  it('has display set to standalone', () => {
    expect(manifest.display).toBe('standalone')
  })

  it('has a start_url', () => {
    expect(manifest.start_url).toBeDefined()
    expect(typeof manifest.start_url).toBe('string')
    expect((manifest.start_url as string).startsWith('/')).toBe(true)
  })

  it('has theme_color', () => {
    expect(manifest.theme_color).toBeDefined()
    expect(typeof manifest.theme_color).toBe('string')
  })

  it('has background_color', () => {
    expect(manifest.background_color).toBeDefined()
    expect(typeof manifest.background_color).toBe('string')
  })

  it('has icons array', () => {
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect((manifest.icons as unknown[]).length).toBeGreaterThanOrEqual(1)
  })

  it('has 192x192 icon', () => {
    const icons = manifest.icons as Array<{ sizes: string; src: string; type?: string }>
    const icon192 = icons.find((icon) => icon.sizes === '192x192')
    expect(icon192).toBeDefined()
    expect(icon192?.src).toBeDefined()
  })

  it('has 512x512 icon', () => {
    const icons = manifest.icons as Array<{ sizes: string; src: string; type?: string }>
    const icon512 = icons.find((icon) => icon.sizes === '512x512')
    expect(icon512).toBeDefined()
    expect(icon512?.src).toBeDefined()
  })

  it('icons have src and sizes', () => {
    const icons = manifest.icons as Array<{ sizes: string; src: string }>
    for (const icon of icons) {
      expect(icon.src).toBeDefined()
      expect(icon.sizes).toBeDefined()
    }
  })

  it('name matches AI Co-Host branding', () => {
    expect(manifest.name).toBe('AI Co-Host')
  })

  it('start_url is /dashboard', () => {
    expect(manifest.start_url).toBe('/dashboard')
  })
})
