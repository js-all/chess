const socket = io("/p");

function draw() {
    ctx.clearRect(0, 0, 2 * ctx.canvas.width, 2 * ctx.canvas.height);
    Arrow.renderArrows(ctx, showLogs);

    // visuallizeBezierCurve(
    //     Arrow.DefaultTransitionBezierCurve.points.p1,
    //     Arrow.DefaultTransitionBezierCurve.points.p2,
    //     Arrow.DefaultTransitionBezierCurve.points.p3,
    //     Arrow.DefaultTransitionBezierCurve.points.p4,
    //     2000,
    //     200
    // );

    requestAnimationFrame(draw);
}

socket.on('disconnect', () => {
    socket.disconnect();
    alert('socket has been disconected, shit\'s gonna break');
});

socket.on('GameState', (gameState: PiecesMap, metadata: GameMetadata) => {
    piecesMap = gameState;
    chessDomMap = generateDom(metadata.playingSide);
    updatePieceDom(piecesMap);
    addEventsListenersToChessTilesDom(metadata.playingSide);
    updateCanvasSize(metadata.playingSide);
    onSendMove = (move) => {
        socket.emit('Move', move);
        clientTurn = false;
    }
    addAllEventsListeners(metadata.playingSide);
    draw();
});

socket.on('GameStateUpdate', (gameState: PiecesMap) => {
    piecesMap = gameState;
    updatePieceDom(piecesMap);

})

socket.on('GameFullError', () => {
    alert('game is full !');
    socket.disconnect();
});

socket.on('InvalidMoveError', () => {
    alert('move was not accepted by server');
    clientTurn = true;
});

socket.on('Turn', () => {
    clientTurn = true;
});
