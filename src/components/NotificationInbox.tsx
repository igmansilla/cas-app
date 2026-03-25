import { Inbox } from '@novu/react'
import { useAuth } from '../hooks/useAuth'
import { novuInboxLocalizationEsAr } from '../lib/novuLocalization'

type NovuEnv = ImportMetaEnv & {
  VITE_NOVU_APPLICATION_IDENTIFIER?: string
  REACT_APP_NOVU_APPLICATION_IDENTIFIER?: string
  VITE_NOVU_BACKEND_URL?: string
  VITE_NOVU_SOCKET_URL?: string
  VITE_NOVU_ENABLE_LOCAL?: string
}

export default function NotificationInbox() {
  const { user } = useAuth()
  const env = import.meta.env as NovuEnv
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const enableLocalNovu = env.VITE_NOVU_ENABLE_LOCAL === 'true'

  if (isLocalhost && !enableLocalNovu) {
    return null
  }

  const applicationIdentifier =
    env.VITE_NOVU_APPLICATION_IDENTIFIER?.trim() ||
    env.REACT_APP_NOVU_APPLICATION_IDENTIFIER?.trim() ||
    ''

  if (!applicationIdentifier) {
    return null
  }

  const subscriberId =
    user?.uid?.trim() || user?.email?.trim() || '69bc6371ae00fefaa00934a5'

  const backendUrl = env.VITE_NOVU_BACKEND_URL?.trim()
  const socketUrl = env.VITE_NOVU_SOCKET_URL?.trim()

  const endpointProps =
    backendUrl &&
    socketUrl &&
    backendUrl.includes('eu.api.novu.co') &&
    socketUrl.includes('eu.ws.novu.co')
      ? { backendUrl, socketUrl }
      : {}

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      placement="bottom-end"
      placementOffset={{ mainAxis: 8, crossAxis: 0 }}
      localization={novuInboxLocalizationEsAr}
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
        },
      }}
    />
  )
}
