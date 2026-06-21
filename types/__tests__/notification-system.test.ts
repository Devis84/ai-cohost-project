import { describe, it, expect } from 'vitest'
import {
  isValidRequestTransition,
  VALID_REQUEST_TRANSITIONS,
  type RequestStatus,
} from '../notification-system'

const ALL_STATUSES: readonly RequestStatus[] = [
  'new',
  'notified',
  'seen',
  'acknowledged',
  'in_progress',
  'resolved',
  'cancelled',
  'escalated',
]

describe('VALID_REQUEST_TRANSITIONS', () => {
  it('covers every RequestStatus value', () => {
    const keys = Object.keys(VALID_REQUEST_TRANSITIONS).sort()
    const expected = [...ALL_STATUSES].sort()
    expect(keys).toEqual(expected)
  })

  it('only contains valid RequestStatus values as targets', () => {
    for (const [, targets] of Object.entries(VALID_REQUEST_TRANSITIONS)) {
      for (const target of targets) {
        expect(ALL_STATUSES).toContain(target)
      }
    }
  })
})

describe('isValidRequestTransition', () => {
  describe('valid transitions', () => {
    const cases: [RequestStatus, RequestStatus][] = [
      ['new', 'notified'],
      ['new', 'cancelled'],
      ['notified', 'seen'],
      ['notified', 'acknowledged'],
      ['notified', 'escalated'],
      ['notified', 'cancelled'],
      ['seen', 'acknowledged'],
      ['seen', 'escalated'],
      ['seen', 'cancelled'],
      ['acknowledged', 'in_progress'],
      ['acknowledged', 'resolved'],
      ['acknowledged', 'cancelled'],
      ['in_progress', 'resolved'],
      ['in_progress', 'escalated'],
      ['in_progress', 'cancelled'],
      ['escalated', 'acknowledged'],
      ['escalated', 'in_progress'],
      ['escalated', 'resolved'],
      ['escalated', 'cancelled'],
    ]

    it.each(cases)('%s → %s is allowed', (from, to) => {
      expect(isValidRequestTransition(from, to)).toBe(true)
    })
  })

  describe('invalid transitions', () => {
    const cases: [RequestStatus, RequestStatus][] = [
      ['new', 'resolved'],
      ['new', 'in_progress'],
      ['new', 'acknowledged'],
      ['notified', 'new'],
      ['notified', 'in_progress'],
      ['notified', 'resolved'],
      ['seen', 'new'],
      ['seen', 'notified'],
      ['seen', 'in_progress'],
      ['seen', 'resolved'],
      ['acknowledged', 'new'],
      ['acknowledged', 'notified'],
      ['acknowledged', 'seen'],
      ['acknowledged', 'escalated'],
      ['in_progress', 'new'],
      ['in_progress', 'notified'],
      ['in_progress', 'seen'],
      ['in_progress', 'acknowledged'],
    ]

    it.each(cases)('%s → %s is rejected', (from, to) => {
      expect(isValidRequestTransition(from, to)).toBe(false)
    })
  })

  describe('terminal states', () => {
    it('resolved has no valid outgoing transitions', () => {
      for (const status of ALL_STATUSES) {
        expect(isValidRequestTransition('resolved', status)).toBe(false)
      }
    })

    it('cancelled has no valid outgoing transitions', () => {
      for (const status of ALL_STATUSES) {
        expect(isValidRequestTransition('cancelled', status)).toBe(false)
      }
    })
  })

  it('self-transition is not allowed', () => {
    for (const status of ALL_STATUSES) {
      expect(isValidRequestTransition(status, status)).toBe(false)
    }
  })
})
