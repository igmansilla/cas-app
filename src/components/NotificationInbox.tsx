import { useEffect, useState } from 'react'
import { Inbox } from '@novu/react'
import { WorkflowCriticalityEnum } from '@novu/react'
import { useAuth } from '../hooks/useAuth'
import { novuInboxLocalizationEsAr } from '../lib/novuLocalization'

type NovuEnv = ImportMetaEnv & {
  VITE_NOVU_APPLICATION_IDENTIFIER?: string
  REACT_APP_NOVU_APPLICATION_IDENTIFIER?: string
  VITE_NOVU_BACKEND_URL?: string
  VITE_NOVU_SOCKET_URL?: string
  VITE_NOVU_MOCK_LOCAL?: string
}

function getDefaultNovuEndpoints() {
  if (typeof window === 'undefined') {
    return null
  }

  const host = window.location.hostname
  if (host.endsWith('casayhueque.org')) {
    return {
      backendUrl: 'https://novu-api.casayhueque.org',
      socketUrl: 'wss://novu-ws.casayhueque.org',
    }
  }

  return null
}

export default function NotificationInbox() {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)

    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const env = import.meta.env as NovuEnv
  const mockLocalInbox = Boolean(import.meta.env.DEV) && env.VITE_NOVU_MOCK_LOCAL === 'true'

  const applicationIdentifier =
    env.VITE_NOVU_APPLICATION_IDENTIFIER?.trim() ||
    env.REACT_APP_NOVU_APPLICATION_IDENTIFIER?.trim() ||
    ''

  if (!applicationIdentifier && !mockLocalInbox) {
    return null
  }

  const subscriberId = user?.uid?.trim() || user?.email?.trim() || ''

  if (!subscriberId && !mockLocalInbox) {
    return null
  }

  const defaultEndpoints = getDefaultNovuEndpoints()
  const backendUrl = env.VITE_NOVU_BACKEND_URL?.trim() || defaultEndpoints?.backendUrl || ''
  const socketUrl = env.VITE_NOVU_SOCKET_URL?.trim() || defaultEndpoints?.socketUrl || ''

  const endpointProps = backendUrl && socketUrl ? { backendUrl, socketUrl } : {}

  const authProps = applicationIdentifier
    ? {
        applicationIdentifier,
        subscriberId,
      }
    : {}

  return (
    <Inbox
      {...authProps}
      placement={isMobile ? 'bottom' : 'bottom-end'}
      placementOffset={{ mainAxis: 8, crossAxis: 0 }}
      localization={novuInboxLocalizationEsAr}
      preferencesFilter={{ criticality: WorkflowCriticalityEnum.ALL }}
      {...endpointProps}
      appearance={{
        variables: {
          colorBackground: 'var(--background)',
          colorForeground: 'var(--foreground)',
          colorPrimary: '#FF6B35',
          colorPrimaryForeground: '#ffffff',
          colorSecondary: 'var(--secondary)',
          colorSecondaryForeground: 'var(--secondary-foreground)',
          colorCounter: '#FF6B35',
          colorCounterForeground: '#ffffff',
          colorNeutral: 'var(--border)',
          colorShadow: 'rgba(15, 23, 42, 0.16)',
          colorRing: '#FF6B35',
          fontSize: '0.875rem',
          borderRadius: '0.75rem',
        },
        elements: {
          bellContainer: {
            borderRadius: '9999px',
            padding: '0.375rem',
          },
          bellIcon: {
            color: '#FF6B35',
          },
          popoverContent: 'novu-popover-content',
          inbox__popoverContent: 'novu-popover-content',
          inboxContent: 'novu-inbox-content',
          notificationListContainer: 'novu-notification-list-container',
        },
      }}
    />
  )
}
