export class Client {
    constructor(socketId, playerName) {
        this.socketId = socketId;
        this.playerName = playerName;
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
