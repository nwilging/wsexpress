import EventEmitter from "events";
import WebSocket, {RawData} from "ws";
import {IncomingMessage} from "http";
import {ClientResponse} from "./server";
const debug = require("debug")('wsexpress-client');

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
            debug('client %s received message (size %d)', this.clientAddress(), Buffer.from(message.toString()).length);
        });

        this.ws.on('close', () => {
            this.emit('disconnect', this);
        });
    }

    public reply (message: ClientResponse): void
    {
        this.ws.send(JSON.stringify(message));
    }

    public close (): void
    {
        this.ws.terminate();
    }

    public getUpgradeRequest (): IncomingMessage
    {
        return this.upgradeRequest;
    }

    public getAddress (): string | undefined
    {
        return this.upgradeRequest.socket.remoteAddress;
    }

    public getPort (): number | undefined
    {
        return this.upgradeRequest.socket.remotePort;
    }

    public clientAddress (): string
    {
        return this.getAddress() + ':' + this.getPort();
    }
}
