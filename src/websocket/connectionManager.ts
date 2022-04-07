import WebSocket from "ws";
import Client from "./client";
import {IncomingMessage} from "http";

export default class ConnectionManager
{
    protected static clients: Array<Client> = [];

    public static handleConnection (ws: WebSocket, request: IncomingMessage): Client
    {
        const client = new Client(ws, request);
        client.on('disconnect', this.handleDisconnect.bind(this));

        this.clients.push(client);
        return client;
    }

    public static handleDisconnect (client: Client): void
    {
        const index = this.clients.indexOf(client);
        if (index === -1) return;

        this.clients.splice(index, 1);
    }
}
