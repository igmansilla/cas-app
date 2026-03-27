// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import NotificationInbox from './NotificationInbox'

type InboxProps = { preferencesFilter?: { criticality?: string } }

const inboxMock = vi.fn((props: unknown) => props)
const useAuthMock = vi.fn<() => { user: { uid: string; email: string } | null }>(() => ({
  user: { uid: 'user-test-123', email: 'test@example.com' },
}))

vi.mock('@novu/react', () => ({
  Inbox: (props: unknown) => {
    inboxMock(props)
    return null
  },
  WorkflowCriticalityEnum: {
    ALL: 'all',
  },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('NotificationInbox', () => {
  beforeEach(() => {
    inboxMock.mockClear()
    useAuthMock.mockReset()
    useAuthMock.mockReturnValue({ user: { uid: 'user-test-123', email: 'test@example.com' } })
    vi.stubEnv('VITE_NOVU_APPLICATION_IDENTIFIER', 'app-id-test')

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(max-width: 767px)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('configures preferences to include critical and non-critical workflows', () => {
    render(<NotificationInbox />)

    expect(inboxMock).toHaveBeenCalled()
    const props = inboxMock.mock.calls[0]![0] as InboxProps

    expect(props.preferencesFilter).toEqual({ criticality: 'all' })
  })

  it('does not mount inbox without a subscriber identity', () => {
    useAuthMock.mockReturnValue({ user: null })

    render(<NotificationInbox />)

    expect(inboxMock).not.toHaveBeenCalled()
  })
})
