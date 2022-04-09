jest.mock("ws");
jest.mock("http");
jest.mock("../../src/websocket/connectionManager");
jest.mock("../../src/router");
import {EventEmitter} from "events";
import ConnectionManager from "../../src/websocket/connectionManager";
import Router from "../../src/router";
import Server from "../../src/websocket/server";
import {Server as WsServer} from "ws";
import {ServerResponse} from "http";
import {when} from "jest-when";

describe ('test server', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test ('test initialize creates new ws server and boots listeners', () => {
        const expressMock: any = {};
        const httpMock: any = {
            on: jest.fn(),
        };

        const wsServerMock: any = {
            on: jest.fn(),
        };

        // @ts-ignore
        when(WsServer).calledWith({ noServer: true }).mockReturnValue(wsServerMock);

        Server.initialize(expressMock, httpMock);

        expect(WsServer).toHaveBeenCalledTimes(1);
        expect(WsServer).toHaveBeenCalledWith({ noServer: true });

        expect(httpMock.on).toHaveBeenCalledTimes(1);
        expect(httpMock.on).toHaveBeenCalledWith('upgrade', expect.any(Function));

        expect(wsServerMock.on).toHaveBeenCalledTimes(1);
        expect(wsServerMock.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    test ('test ws handle upgrade on http server upgrade request', () => {
        const expressMock: any = {};
        const httpMock: any = new class extends EventEmitter {};

        const wsServerMock: any = {
            on: jest.fn(),
            handleUpgrade: jest.fn(),
        };

        // @ts-ignore
        when(WsServer).calledWith({ noServer: true }).mockReturnValue(wsServerMock);

        Server.initialize(expressMock, httpMock);
        expect(WsServer).toHaveBeenCalledTimes(1);
        expect(WsServer).toHaveBeenCalledWith({ noServer: true });

        const requestMock: any = { socket: {} };
        const socketMock: any = {};
        const headMock: any = {};

        httpMock.emit('upgrade', requestMock, socketMock, headMock);

        expect(wsServerMock.handleUpgrade).toHaveBeenCalledTimes(1);
        expect(wsServerMock.handleUpgrade).toHaveBeenCalledWith(requestMock, socketMock, headMock, expect.any(Function));
    });

    test ('test ws server on connection calls connection manager', () => {
        const expressMock: any = {};
        const httpMock: any = {
            on: jest.fn(),
        };

        const wsServerMock: any = new class extends EventEmitter {};

        // @ts-ignore
        when(WsServer).calledWith({ noServer: true }).mockReturnValue(wsServerMock);

        Server.initialize(expressMock, httpMock);

        const wsMock: any = {};
        const requestMock: any = {};

        const clientMock: any = {
            on: jest.fn(),
        };

        when(ConnectionManager.handleConnection).calledWith(wsMock, requestMock).mockReturnValue(clientMock);
        wsServerMock.emit('connection', wsMock, requestMock);

        expect(ConnectionManager.handleConnection).toHaveBeenCalledTimes(1);
        expect(ConnectionManager.handleConnection).toHaveBeenCalledWith(wsMock, requestMock);
        expect(clientMock.on).toHaveBeenCalledTimes(1);
        expect(clientMock.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    test ('test response sent on client message', () => {
        const expressMock: any = {
            request: {},
            response: {},
        };
        const httpMock: any = {
            on: jest.fn(),
        };

        const wsServerMock: any = new class extends EventEmitter {};

        // @ts-ignore
        when(WsServer).calledWith({ noServer: true }).mockReturnValue(wsServerMock);

        Server.initialize(expressMock, httpMock);

        const wsMock: any = {};
        const requestMock: any = {};

        const clientMock: any = new class extends EventEmitter {
            getUpgradeRequest = jest.fn();
            reply = jest.fn();
            clientAddress = jest.fn();
        };

        when(ConnectionManager.handleConnection).calledWith(wsMock, requestMock).mockReturnValue(clientMock);
        when(clientMock.getUpgradeRequest).calledWith().mockReturnValue(requestMock);

        wsServerMock.emit('connection', wsMock, requestMock);

        expect(ConnectionManager.handleConnection).toHaveBeenCalledTimes(1);
        expect(ConnectionManager.handleConnection).toHaveBeenCalledWith(wsMock, requestMock);

        const serverResponseMock: any = {};
        // @ts-ignore
        when(ServerResponse).calledWith(requestMock).mockReturnValue(serverResponseMock);

        const message: any = Buffer.from(JSON.stringify({
            route: '/test',
            method: 'get',
        }));

        const routeMock: any = {
            handle: jest.fn(),
        };
        when(Router.getRoute).calledWith('/test', 'get').mockReturnValue(routeMock);

        clientMock.emit('message', clientMock, message);

        const expectedRequest = Object.assign(expressMock.request, requestMock);
        const expectedResponse = Object.assign(expressMock.response, serverResponseMock, { app: expressMock });

        expect(routeMock.handle).toHaveBeenCalledTimes(1);
        expect(routeMock.handle).toHaveBeenCalledWith(expectedRequest, expectedResponse, expect.any(Function));

        // Simulate the response.send call
        const mockBody: any = {};
        expectedResponse.statusCode = 200;
        expectedResponse.send(mockBody);

        const expectedMessage = {
            request: {
                route: '/test',
                method: 'get',
            },
            response: {
                status: 200,
                body: mockBody,
            },
        };

        expect(clientMock.reply).toHaveBeenCalledTimes(1);
        expect(clientMock.reply).toHaveBeenCalledWith(expectedMessage);
    });

    test ('test 404 response sent when route not found', () => {
        const expressMock: any = {
            request: {},
            response: {},
        };
        const httpMock: any = {
            on: jest.fn(),
        };

        const wsServerMock: any = new class extends EventEmitter {};

        // @ts-ignore
        when(WsServer).calledWith({ noServer: true }).mockReturnValue(wsServerMock);

        Server.initialize(expressMock, httpMock);

        const wsMock: any = {};
        const requestMock: any = {};

        const clientMock: any = new class extends EventEmitter {
            getUpgradeRequest = jest.fn();
            reply = jest.fn();
        };

        when(ConnectionManager.handleConnection).calledWith(wsMock, requestMock).mockReturnValue(clientMock);
        when(clientMock.getUpgradeRequest).calledWith().mockReturnValue(requestMock);

        wsServerMock.emit('connection', wsMock, requestMock);

        expect(ConnectionManager.handleConnection).toHaveBeenCalledTimes(1);
        expect(ConnectionManager.handleConnection).toHaveBeenCalledWith(wsMock, requestMock);

        const serverResponseMock: any = {};
        // @ts-ignore
        when(ServerResponse).calledWith(requestMock).mockReturnValue(serverResponseMock);

        const message: any = Buffer.from(JSON.stringify({
            route: '/test',
            method: 'get',
        }));

        when(Router.getRoute).calledWith('/test', 'get').mockReturnValue(null);

        clientMock.emit('message', clientMock, message);

        const expectedMessage = {
            request: {
                route: '/test',
                method: 'get',
            },
            response: {
                status: 404,
            },
        };

        expect(clientMock.reply).toHaveBeenCalledTimes(1);
        expect(clientMock.reply).toHaveBeenCalledWith(expectedMessage);
    });
});
