import { useState, useEffect } from 'react'
import { Card, Space, Typography, Button, Tag, Spin, Alert, Row, Col, Statistic } from 'antd'
import { 
  TrophyOutlined, 
  HomeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { 
  doc, 
  collection, 
  setDoc, 
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  getDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useOnlineGame } from '../../hooks/useOnlineGame'
import { useAuth } from '../../hooks/useAuth'
import { Board } from './Board'
import { useGameStore } from '../../stores/gameStore'
import { createEmptyBoardFlat } from '../../types/game'
import { PairChat } from '../Chat/PairChat'

const { Title, Text } = Typography

interface SessionStats {
  myWins: number
  opponentWins: number
  draws: number
}

interface LifetimeStats {
  wins: number
  losses: number
  draws: number
}

interface OnlineGameProps {
  gameId: string
  onLeave: () => void
}

export const OnlineGame = ({ gameId: initialGameId, onLeave }: OnlineGameProps) => {
  const { user } = useAuth()
  const [currentGameId, setCurrentGameId] = useState(initialGameId)
  const [sessionStats, setSessionStats] = useState<SessionStats>({ myWins: 0, opponentWins: 0, draws: 0 })
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null)
  const [rematchPending, setRematchPending] = useState(false)
  
  const { 
    gameState, 
    loading, 
    error, 
    myColor, 
    isMyTurn, 
    makeMove,
    leaveGame,
  } = useOnlineGame(currentGameId, user?.uid)

  // Get opponent info
  const opponentColor = myColor === 'red' ? 'yellow' : 'red'
  const opponentId = gameState?.players[opponentColor]
  const opponentName = gameState?.playerNames[opponentColor]

  // Load lifetime stats against opponent (realtime listener)
  useEffect(() => {
    if (!user?.uid || !opponentId) return

    const historyRef = doc(db, 'userHistory', user.uid, 'opponents', opponentId)
    
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setLifetimeStats({
          wins: data.wins || 0,
          losses: data.losses || 0,
          draws: data.draws || 0,
        })
      } else {
        setLifetimeStats({ wins: 0, losses: 0, draws: 0 })
      }
    })

    return () => unsubscribe()
  }, [user?.uid, opponentId])

  // Update session stats when game ends
  useEffect(() => {
    if (!gameState || gameState.status === 'playing') return
    
    // Only count once per game
    const gameEndKey = `session_counted_${currentGameId}`
    if (sessionStorage.getItem(gameEndKey)) return
    sessionStorage.setItem(gameEndKey, 'true')

    if (gameState.status === 'won') {
      if (gameState.winner === myColor) {
        setSessionStats(prev => ({ ...prev, myWins: prev.myWins + 1 }))
      } else {
        setSessionStats(prev => ({ ...prev, opponentWins: prev.opponentWins + 1 }))
      }
    } else if (gameState.status === 'draw') {
      setSessionStats(prev => ({ ...prev, draws: prev.draws + 1 }))
    }
  }, [gameState?.status, currentGameId, myColor])

  // Update own lifetime stats in Firestore when game ends
  // Each client updates only their own stats (due to Firestore security rules)
  useEffect(() => {
    if (!user?.uid || !opponentId || !opponentName || !gameState || !myColor) return
    if (gameState.status === 'playing') return
    
    // Only count once per game (separate key from session stats)
    const firestoreKey = `firestore_stats_${currentGameId}`
    if (sessionStorage.getItem(firestoreKey)) return
    sessionStorage.setItem(firestoreKey, 'true')

    const updateOwnStats = async () => {
      // Determine result from my perspective
      let result: 'win' | 'loss' | 'draw'
      if (gameState.status === 'won') {
        result = gameState.winner === myColor ? 'win' : 'loss'
      } else if (gameState.status === 'draw') {
        result = 'draw'
      } else {
        return // abandoned games don't count
      }

      try {
        // 1. Update global user stats
        const userRef = doc(db, 'users', user.uid)
        const statField = result === 'win' ? 'stats.wins' : result === 'loss' ? 'stats.losses' : 'stats.draws'
        await updateDoc(userRef, {
          [statField]: increment(1),
        })

        // 2. Update opponent history
        const historyRef = doc(db, 'userHistory', user.uid, 'opponents', opponentId)
        const historySnap = await getDoc(historyRef)
        const historyStatField = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws'

        if (historySnap.exists()) {
          await updateDoc(historyRef, {
            [historyStatField]: increment(1),
            lastPlayed: serverTimestamp(),
          })
        } else {
          await setDoc(historyRef, {
            opponentName,
            wins: result === 'win' ? 1 : 0,
            losses: result === 'loss' ? 1 : 0,
            draws: result === 'draw' ? 1 : 0,
            lastPlayed: serverTimestamp(),
          })
        }
      } catch (err) {
        console.error('Failed to update stats:', err)
      }
    }

    updateOwnStats()
  }, [user?.uid, opponentId, opponentName, gameState?.status, currentGameId, myColor, gameState?.winner])

  // Listen for rematch game creation (either player can start)
  useEffect(() => {
    if (!user?.uid || !opponentId || !gameState || gameState.status === 'playing') return

    const rematchRef = doc(db, 'rematch', `${[user.uid, opponentId].sort().join('_')}`)
    
    const unsubscribe = onSnapshot(rematchRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        // If there's a new game and it's different from current, switch to it
        if (data.gameId && data.gameId !== currentGameId) {
          setCurrentGameId(data.gameId)
          setRematchPending(false)
        }
      }
    })

    return () => unsubscribe()
  }, [user?.uid, opponentId, gameState?.status, currentGameId])

  // Sync game state to local store for Board component
  useEffect(() => {
    if (gameState) {
      useGameStore.setState({
        board: gameState.board,
        currentPlayer: gameState.currentPlayer,
        winner: gameState.winner,
        winningCells: gameState.winningCells,
        status: gameState.status === 'playing' ? 'playing' : 
                gameState.status === 'won' ? 'won' : 
                gameState.status === 'draw' ? 'draw' : 'waiting',
        players: {
          red: gameState.playerNames.red,
          yellow: gameState.playerNames.yellow,
        },
      })
    }
  }, [gameState])

  const handleColumnClick = async (col: number) => {
    if (!isMyTurn) return
    await makeMove(col)
  }

  useEffect(() => {
    if (gameState?.status === 'playing') {
      useGameStore.setState({
        dropPiece: handleColumnClick as unknown as (col: number) => boolean,
      })
    }
  }, [isMyTurn, gameState?.status])

  const handleRematch = async () => {
    if (!user?.uid || !opponentId || !myColor || !gameState) return
    
    setRematchPending(true)
    
    try {
      // Switch colors for new game
      const newRedPlayer = gameState.players.yellow
      const newYellowPlayer = gameState.players.red
      const newRedName = gameState.playerNames.yellow
      const newYellowName = gameState.playerNames.red
      
      // Create new game immediately
      const gamesRef = collection(db, 'games')
      const newGameRef = doc(gamesRef)
      
      await setDoc(newGameRef, {
        players: { red: newRedPlayer, yellow: newYellowPlayer },
        playerNames: { red: newRedName, yellow: newYellowName },
        board: createEmptyBoardFlat(),
        currentPlayer: 'red',
        status: 'playing',
        winner: null,
        winningCells: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      
      // Update rematch doc so opponent gets notified
      const sortedIds = [user.uid, opponentId].sort()
      const rematchRef = doc(db, 'rematch', sortedIds.join('_'))
      
      await setDoc(rematchRef, {
        players: [user.uid, opponentId],
        gameId: newGameRef.id,
        createdAt: serverTimestamp(),
      })
      
      // Switch to new game (will also happen via listener, but do it immediately for responsiveness)
      setCurrentGameId(newGameRef.id)
      setRematchPending(false)
    } catch (err) {
      console.error('Rematch failed:', err)
      setRematchPending(false)
    }
  }

  const handleLeave = async () => {
    await leaveGame()
    onLeave()
  }

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Lade Spiel...</div>
      </Card>
    )
  }

  if (error || !gameState) {
    return (
      <Card>
        <Alert 
          message="Fehler" 
          description={error || 'Spiel nicht gefunden'} 
          type="error" 
          showIcon 
        />
        <Button onClick={onLeave} style={{ marginTop: 16 }}>
          Zurueck
        </Button>
      </Card>
    )
  }

  const getStatusMessage = () => {
    if (gameState.status === 'won') {
      const winnerName = gameState.winner === 'red' 
        ? gameState.playerNames.red 
        : gameState.playerNames.yellow
      const isWinner = gameState.winner === myColor
      
      return (
        <Space>
          <TrophyOutlined style={{ color: '#faad14', fontSize: '24px' }} />
          <Text style={{ fontSize: '18px' }}>
            {isWinner ? 'Du hast gewonnen!' : `${winnerName} hat gewonnen!`}
          </Text>
        </Space>
      )
    }
    
    if (gameState.status === 'draw') {
      return <Text style={{ fontSize: '18px' }}>Unentschieden!</Text>
    }
    
    if (gameState.status === 'abandoned') {
      return <Text style={{ fontSize: '18px' }}>Spiel abgebrochen</Text>
    }

    return (
      <Space>
        {isMyTurn ? (
          <>
            <ClockCircleOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '16px', color: '#52c41a' }}>Du bist dran!</Text>
          </>
        ) : (
          <>
            <ClockCircleOutlined style={{ color: '#faad14' }} />
            <Text style={{ fontSize: '16px' }}>Gegner ist am Zug...</Text>
          </>
        )}
      </Space>
    )
  }

  const isGameOver = gameState.status !== 'playing'
  const totalSessionGames = sessionStats.myWins + sessionStats.opponentWins + sessionStats.draws

  return (
    <Card
      style={{
        background: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(245, 34, 45, 0.3)',
        borderRadius: '16px',
        maxWidth: 600,
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Player Info */}
        <Row gutter={16}>
          <Col span={12}>
            <Card 
              size="small" 
              style={{ 
                background: myColor === 'red' ? 'rgba(245, 34, 45, 0.1)' : 'transparent',
                borderColor: gameState.currentPlayer === 'red' ? '#f5222d' : 'transparent',
              }}
            >
              <Space>
                <Tag color="#f5222d">ROT</Tag>
                <UserOutlined />
                <Text>{gameState.playerNames.red}</Text>
                {myColor === 'red' && <Tag color="blue">Du</Tag>}
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              size="small"
              style={{ 
                background: myColor === 'yellow' ? 'rgba(250, 219, 20, 0.1)' : 'transparent',
                borderColor: gameState.currentPlayer === 'yellow' ? '#fadb14' : 'transparent',
              }}
            >
              <Space>
                <Tag color="#fadb14" style={{ color: '#000' }}>GELB</Tag>
                <UserOutlined />
                <Text>{gameState.playerNames.yellow}</Text>
                {myColor === 'yellow' && <Tag color="blue">Du</Tag>}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Statistics */}
        {(totalSessionGames > 0 || lifetimeStats) && (
          <Card size="small" title={<><HistoryOutlined /> Statistik vs {opponentName}</>}>
            <Row gutter={16}>
              {/* Session Stats */}
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>Diese Session</Text>
                <Row gutter={8} style={{ marginTop: 4 }}>
                  <Col span={8}>
                    <Statistic 
                      title={<Text style={{ fontSize: 10 }}>Du</Text>}
                      value={sessionStats.myWins}
                      valueStyle={{ color: '#52c41a', fontSize: 18 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<Text style={{ fontSize: 10 }}>{opponentName?.split(' ')[0]}</Text>}
                      value={sessionStats.opponentWins}
                      valueStyle={{ color: '#f5222d', fontSize: 18 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title={<Text style={{ fontSize: 10 }}>Draw</Text>}
                      value={sessionStats.draws}
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                </Row>
              </Col>
              
              {/* Lifetime Stats */}
              {lifetimeStats && (
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Lifetime</Text>
                  <Row gutter={8} style={{ marginTop: 4 }}>
                    <Col span={8}>
                      <Statistic 
                        title={<Text style={{ fontSize: 10 }}>Siege</Text>}
                        value={lifetimeStats.wins}
                        valueStyle={{ color: '#52c41a', fontSize: 18 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title={<Text style={{ fontSize: 10 }}>Niederl.</Text>}
                        value={lifetimeStats.losses}
                        valueStyle={{ color: '#f5222d', fontSize: 18 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title={<Text style={{ fontSize: 10 }}>Draw</Text>}
                        value={lifetimeStats.draws}
                        valueStyle={{ fontSize: 18 }}
                      />
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          </Card>
        )}

        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            {getStatusMessage()}
          </Title>
        </div>

        {/* Board */}
        <Board />

        {/* Pair Chat */}
        {user?.uid && opponentId && myColor && (
          <PairChat
            pairId={[user.uid, opponentId].sort().join('_')}
            currentUid={user.uid}
            myColor={myColor}
            opponentUid={opponentId}
          />
        )}

        {/* Actions */}
        <Space style={{ width: '100%', justifyContent: 'center' }} wrap>
          {isGameOver && gameState.status !== 'abandoned' && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRematch}
              loading={rematchPending}
              size="large"
            >
              Nochmal spielen
            </Button>
          )}
          <Button
            icon={<HomeOutlined />}
            onClick={handleLeave}
            size="large"
            danger={!isGameOver}
          >
            {isGameOver ? 'Beenden' : 'Aufgeben'}
          </Button>
        </Space>

      </Space>
    </Card>
  )
}
