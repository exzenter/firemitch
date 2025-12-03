// =============================================================================
// ONLINE USERS BANNER KOMPONENTE
// =============================================================================
// Zeigt alle Online-User in einem durchlaufenden Banner wie eine Leuchtreklame.

import { Typography } from 'antd'
import { useOnlineUsers } from '../../hooks/useOnlineUsers'
import './OnlineUsersBanner.css'

const { Text } = Typography

// -----------------------------------------------------------------------------
// KOMPONENTE
// -----------------------------------------------------------------------------

export const OnlineUsersBanner = () => {
  const { onlineUsers, onlineCount } = useOnlineUsers()

  // Erstelle mehrere Kopien für kontinuierliches Scrollen
  const repeatedUsers = onlineUsers.length > 0 
    ? [...onlineUsers, ...onlineUsers, ...onlineUsers, ...onlineUsers]
    : []

  return (
    <div className="online-users-banner">
      {/* Counter oben */}
      <div className="online-counter">
        <Text strong>🟢 Gerade Online: {onlineCount} Spieler</Text>
      </div>
      
      {/* Scrolling Banner - nur anzeigen wenn User vorhanden */}
      {onlineUsers.length > 0 && (
        <div className="banner-scroll-container">
          <div className="banner-scroll-content">
            {repeatedUsers.map((user, index) => (
              <span
                key={`${user.uid}-${index}`}
                className="banner-username"
              >
                {user.displayName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

