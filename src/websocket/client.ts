import EventEmitter from "events";
import WebSocket, {RawData} from "ws";
import {IncomingMessage} from "http";

export default class Client extends EventEmitter
{
    protected ws: WebSocket;
    protected upgradeRequest: IncomingMessage;

    public constructor (ws: WebSocket, upgradeRequest: IncomingMessage)
    {
        super();

        this.ws = ws;
        this.upgradeRequest = upgradeRequest;

        this.ws.on('message', (message: RawData) => {
            this.emit('message', this, message);
        });

        this.ws.on('close', (ws: WebSocket, code: number, reason: Buffer) => {
            this.emit('disconnect', this);
        });
    }

    public reply (message: Buffer): void
    {
        this.ws.send(message);
    }

    public close (): void
    {
        this.ws.terminate();
    }

    public getUpgradeRequest (): IncomingMessage
    {
        return this.upgradeRequest;
    }
}
