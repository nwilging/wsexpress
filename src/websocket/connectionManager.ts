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
