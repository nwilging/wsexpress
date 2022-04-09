import {EventEmitter} from "events";
import WebSocket, {RawData} from "ws";
import {IncomingMessage} from "http";
import {ClientMessage, ClientResponse} from "./server";
const debug = require("debug")('wsexpress-client');

export interface EventSubscription
{
    eventName: string;
    subscriptionId?: string;

    request: ClientMessage;
}

export default class Client extends EventEmitter
{
    protected ws: WebSocket;
    protected upgradeRequest: IncomingMessage;

    protected subscriptions: Array<EventSubscription> = [];

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

    public addSubscription (subscription: EventSubscription): void
    {
        if (this.getSubscription(subscription.eventName, subscription.subscriptionId)) {
            return;
        }

        this.subscriptions.push(subscription);
    }

    public getSubscription (eventName: string, subscriptionId?: string): EventSubscription | null
    {
        return this.subscriptions.filter((subscription: EventSubscription) => {
            return this.subscriptionComparison(subscription, eventName, subscriptionId);
        })[0] || null;
    }

    protected subscriptionComparison (comparingTo: EventSubscription, eventName: string, subscriptionId?: string): boolean
    {
        return comparingTo.eventName === eventName && ((subscriptionId) ? comparingTo.subscriptionId === subscriptionId : true);
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
