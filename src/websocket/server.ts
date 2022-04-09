import WebSocket, {RawData, Server as WsServer} from "ws";
import {IncomingMessage, Server as HttpServer, ServerResponse} from "http";
import {Duplex} from "stream";
import ConnectionManager from "./connectionManager";
import Router from "../router";
import Client, {EventSubscription} from "./client";
import {Express, Request, Response} from "express";
const debug = require("debug")('wsexpress-server');

export type ClientMessageType = 'route' | 'subscription';

export interface ClientRouteMessage
{
    route: string;
    method: string;
    body?: any;
}

export interface ClientSubscriptionMessage
{
    eventName: string;
    subscriptionId?: string;
}

export interface ClientMessage
{
    type: ClientMessageType;
    message: ClientRouteMessage | ClientSubscriptionMessage;
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

        switch (parsed.type) {
            case 'route':
                this.handleClientRouteMessage(client, parsed.message as ClientRouteMessage, parsed);
                break;
            case 'subscription':
                this.handleClientSubscriptionMessage(client, parsed.message as ClientSubscriptionMessage, parsed);
                break;
        }
    }

    protected static handleClientRouteMessage (client: Client, message: ClientRouteMessage, request: ClientMessage): void
    {
        const route = Router.getRoute(message.route, message.method);
        if (!route) {
            client.reply({
                request,
                response: {
                    status: 404,
                },
            });
            return;
        }

        const routeRequest = this.buildRequest(client);
        const routeResponse = this.buildResponse(client);

        if (routeResponse.req) routeResponse.req.method = message.method;

        routeRequest.method = message.method;
        routeRequest.body = message.body;

        routeResponse.send = (body?: any): any => {
            const wsResponse = {
                request,
                response: {
                    body,
                    status: routeResponse.statusCode,
                },
            };

            client.reply(wsResponse);
            debug('replied to client %s (size %d)', client.clientAddress(), Buffer.from(JSON.stringify(wsResponse)).length);
        };

        route.handle(routeRequest, routeResponse, (error: any) => console.error('error: ' + error));
    }

    protected static handleClientSubscriptionMessage (client: Client, message: ClientSubscriptionMessage, request: ClientMessage): void
    {
        const subscription: EventSubscription = {
            request,
            eventName: message.eventName,
            subscriptionId: message.subscriptionId,
        };

        client.addSubscription(subscription);

        const reply: ClientResponse = {
            request,
            response: {
                status: 200,
                body: {
                    subscription: message,
                },
            },
        };
        client.reply(reply);
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
