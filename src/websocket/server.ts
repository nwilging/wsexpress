import WebSocket, {RawData, Server as WsServer} from "ws";
import {IncomingMessage, Server as HttpServer, ServerResponse} from "http";
import {Duplex} from "stream";
import ConnectionManager from "./connectionManager";
import Router from "../router";
import Client from "./client";
import * as express from "express";
import {Application} from "express";

export interface ClientMessage
{
    route: string;
    method: string;
}

export default class Server
{
    protected static ws: WsServer;
    protected static express: Application;
    protected static http: HttpServer;

    public static initialize (express: Application, http: HttpServer): void
    {
        this.http = http;
        this.express = express;
        this.ws = new WsServer({ noServer: true });

        this.bootListeners();
    }

    public static handleUpgrade (request: IncomingMessage, socket: Duplex, head: Buffer): void
    {
        this.ws.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            this.ws.emit('connection', ws, request);
        });
    }

    protected static bootListeners (): void
    {
        this.http.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer): void => {
            this.handleUpgrade(req, socket, head);
        });

        this.ws.on('connection', (ws: WebSocket, request: IncomingMessage) => {
            const client = ConnectionManager.handleConnection(ws, request);
            client.on('message', (client: Client, message: RawData) => {
                this.handleClientMessage(client, message);
            });
        });
    }

    protected static handleClientMessage (client: Client, message: RawData): void
    {
        const parsed = JSON.parse(message.toString()) as ClientMessage;
        if (!parsed) return;

        const route = Router.getRoute(parsed.route);
        if (!route) return;

        // @ts-ignore
        const response = this.express.response;
        const req = { ...client.getUpgradeRequest(), headers: { ...client.getUpgradeRequest().headers, 'Content-Type': 'application/json' }};

        const result = route.handle(req, response, (error: any) => console.error(error));
        console.log(result);
    }
}
