let createController = () => {
  let gameloop
  let startGame = () => { gameloop = setInterval(() => gameloopTick, 1000) }
  let stopGame = () => { gameloop.stop() }

  let gameloopTick = () => {
  }

  return {
    startGame,
    stopGame
  }
}

export const Controller = createController()
