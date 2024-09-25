export class Client {
    constructor(socketId, playerName, accessToken) {
        this.socketId = socketId;
        this.playerName = playerName;
        this.accessToken = accessToken;
        this.score = 0;
        this.room = null;
    }

    setRoom(room) {
        this.room = room;
    }

    delRoom(room) {
        if (this.room === room)
            this.room = null;
    }

    getName() {
        return this.playerName;
    }

    getRoom() {
        return this.room;
    }

    resetScore() {
        this.score = 0;
    }

    incrementScore() {
        this.score++;
    }

    getSocketId() {
        return this.socketId;
    }

    getPlayerName() {
        return this.playerName;
    }
}
