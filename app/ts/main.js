"use strict";
const socket = io("/p");
function draw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
socket.on('GameState', (gameState, metadata) => {
    piecesMap = gameState;
    chessDomMap = generateDom(metadata.playingSide);
    updatePieceDom(piecesMap);
    addEventsListenersToChessTilesDom();
    updateCanvasSize();
    onSendMove = (move) => {
        socket.emit('Move', move);
        clientTurn = false;
    };
    addAllEventsListeners();
    draw();
});
socket.on('GameStateUpdate', (gameState) => {
    piecesMap = gameState;
    updatePieceDom(piecesMap);
});
socket.on('GameFullError', () => {
    alert('game is full !');
    socket.disconnect();
});
socket.on('InvalidMoveError', () => {
    alert('move was not accepted by server');
});
socket.on('Turn', () => {
    clientTurn = true;
});
