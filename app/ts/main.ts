import {
    addAllEventsListeners,
    generateDom,
    updatePieceDom,
    addEventsListenersToChessTilesDom,
    onSendMove,
    updateCanvasSize,
    setTurn,
    getPieceMap,
    setPieceMap,
    setChessDomMap
 } from './chess';
 import {Arrow} from './arrows';


const socket = io("/p");

function draw() {
    Arrow.ctx.clearRect(0, 0, 2 * Arrow.ctx.canvas.width, 2 * Arrow.ctx.canvas.height);
    Arrow.renderArrows(Arrow.ctx,Arrow.showLogs);

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
    setPieceMap(gameState)
    setChessDomMap(generateDom(metadata.playingSide));
    updatePieceDom(getPieceMap());
    addEventsListenersToChessTilesDom(metadata.playingSide);
    updateCanvasSize(metadata.playingSide);
    onSendMove((move) => {
        socket.emit('Move', move);
        setTurn(false);
    })
    addAllEventsListeners(metadata.playingSide);
    draw();
});

socket.on('GameStateUpdate', (gameState: PiecesMap) => {
    setPieceMap(gameState);
    updatePieceDom(getPieceMap());

})

socket.on('GameFullError', () => {
    alert('game is full !');
    socket.disconnect();
});

socket.on('InvalidMoveError', () => {
    alert('move was not accepted by server');
    setTurn(true);
});

socket.on('Turn', () => {
    setTurn(true);
});
