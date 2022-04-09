import WebSocket from "ws";
import Client from "./client";
import {IncomingMessage} from "http";
const debug = require("debug")('wsexpress-connections');

export default class ConnectionManager
{
    protected static clients: Array<Client> = [];

    public static getClients (): Array<Client>
    {
        return this.clients;
    }

    public static broadcast (eventName: string, body: any, subscriptionId?: string): void
    {
        for (const client of this.clients) {
            const subscription = client.getSubscription(eventName, subscriptionId);
            if (!subscription) continue;

            client.reply({
                request: subscription.request,
                response: {
                    status: 200,
                    body,
                },
            });
        }
    }

    public static handleConnection (ws: WebSocket, request: IncomingMessage): Client
    {
        const client = new Client(ws, request);
        client.on('disconnect', this.handleDisconnect.bind(this));

        this.clients.push(client);

        debug('new client connection: %s', client.clientAddress());
        return client;
    }

    public static handleDisconnect (client: Client): void
    {
        const index = this.clients.indexOf(client);
        if (index === -1) return;

        this.clients.splice(index, 1);
        debug('client disconnected: %s', client.clientAddress());
    }
}
