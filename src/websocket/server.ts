import WebSocket, {RawData, Server as WsServer} from "ws";
import {IncomingMessage, Server as HttpServer, ServerResponse} from "http";
import {Duplex} from "stream";
import ConnectionManager from "./connectionManager";
import Router from "../router";
import Client from "./client";
import {Express, Request, Response} from "express";
const debug = require("debug")('wsexpress-server');

export interface ClientMessage
{
    route: string;
    method: string;
}

export interface ClientResponse
{
    request: ClientMessage;
    response: {
        status: number;
        body?: any;
    },
}

export default class Server
{
    protected static ws: WsServer;
    protected static express: Express;
    protected static http: HttpServer;

    public static initialize (express: Express, http: HttpServer): void
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
            debug('upgrade request from %s:%s', req.socket.remoteAddress, req.socket.remotePort);
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

        const route = Router.getRoute(parsed.route, parsed.method);
        if (!route) {
            client.reply({
                request: parsed,
                response: {
                    status: 404,
                },
            });
            return;
        }

        const request = this.buildRequest(client);
        const response = this.buildResponse(client);

        response.send = (body?: any): any => {
            const wsResponse = {
                request: parsed,
                response: {
                    body,
                    status: response.statusCode,
                },
            };

            client.reply(wsResponse);
            debug('replied to client %s (size %d)', client.clientAddress(), Buffer.from(JSON.stringify(wsResponse)).length);
        };

        route.handle(request, response, (error: any) => console.error(error));
    }

    protected static buildRequest (client: Client): Request
    {
        return Object.assign(this.express.request, client.getUpgradeRequest());
    }

    protected static buildResponse (client: Client): Response
    {
        return Object.assign(
            this.express.response,
            new ServerResponse(client.getUpgradeRequest()),
            { app: this.express },
        );
    }
}
