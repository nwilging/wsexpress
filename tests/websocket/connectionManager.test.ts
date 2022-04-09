jest.mock("../../src/websocket/client");
import ConnectionManager from "../../src/websocket/connectionManager";
import Client from "../../src/websocket/client";
import {EventEmitter} from "events";
import {when} from "jest-when";

describe ('test connection manager', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        // @ts-ignore
        ConnectionManager.clients = [];
    });

    test ('test handleConnection adds new client to stack', () => {
        const wsMock: any = {};
        const requestMock: any = {};

        const clientMock: any = {
            on: jest.fn(),
            clientAddress: jest.fn(),
        };

        // @ts-ignore
        when(Client).calledWith(wsMock, requestMock).mockReturnValue(clientMock);

        const result = ConnectionManager.handleConnection(wsMock, requestMock);
        expect(result).toBe(clientMock);

        expect(clientMock.on).toHaveBeenCalledTimes(1);
        expect(clientMock.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

        expect(ConnectionManager.getClients()).toEqual([clientMock]);
    });

    test ('test handleConnection binds handleDisconnect to client disconnect event', () => {
        const wsMock: any = {};
        const requestMock: any = {};

        const clientMock: any = new class extends EventEmitter {
            clientAddress = jest.fn();
        };

        // @ts-ignore
        when(Client).calledWith(wsMock, requestMock).mockReturnValue(clientMock);

        const result = ConnectionManager.handleConnection(wsMock, requestMock);
        expect(result).toBe(clientMock);

        clientMock.emit('disconnect', clientMock);

        expect(ConnectionManager.getClients()).toEqual([]);
    });

    test ('test broadcast sends message', () => {
        const clientMock: any = {
            getSubscription: jest.fn(),
            reply: jest.fn(),
        };

        // @ts-ignore
        ConnectionManager.clients = [clientMock];

        const eventName = 'test-event';
        const subscriptionId = 'test-id';
        const body = {};

        const subscriptionMock: any = {
            request: {},
        };
        when(clientMock.getSubscription).calledWith(eventName, subscriptionId).mockReturnValue(subscriptionMock);

        ConnectionManager.broadcast(eventName, body, subscriptionId);

        expect(clientMock.getSubscription).toHaveBeenCalledTimes(1);
        expect(clientMock.getSubscription).toHaveBeenCalledWith(eventName, subscriptionId);

        expect(clientMock.reply).toHaveBeenCalledTimes(1);
        expect(clientMock.reply).toHaveBeenCalledWith({
            request: subscriptionMock.request,
            response: {
                status: 200,
                body,
            },
        });
    });

    test ('test broadcast does nothing when no subscription found', () => {
        const clientMock: any = {
            getSubscription: jest.fn(),
            reply: jest.fn(),
        };

        // @ts-ignore
        ConnectionManager.clients = [clientMock];

        const eventName = 'test-event';
        const subscriptionId = 'test-id';
        const body = {};

        when(clientMock.getSubscription).calledWith(eventName, subscriptionId).mockReturnValue(null);

        ConnectionManager.broadcast(eventName, body, subscriptionId);

        expect(clientMock.getSubscription).toHaveBeenCalledTimes(1);
        expect(clientMock.getSubscription).toHaveBeenCalledWith(eventName, subscriptionId);

        expect(clientMock.reply).not.toHaveBeenCalled();
    });

    test ('test broadcast sends messages to multiple clients', () => {
        const client1Mock: any = {
            getSubscription: jest.fn(),
            reply: jest.fn(),
        };

        const client2Mock: any = {
            getSubscription: jest.fn(),
            reply: jest.fn(),
        };

        // @ts-ignore
        ConnectionManager.clients = [client1Mock, client2Mock];

        const eventName = 'test-event';
        const subscriptionId = 'test-id';
        const body = {};

        const subscription1Mock: any = {
            request: {},
        };

        const subscription2Mock: any = {
            request: {},
        };

        when(client1Mock.getSubscription).calledWith(eventName, subscriptionId).mockReturnValue(subscription1Mock);
        when(client2Mock.getSubscription).calledWith(eventName, subscriptionId).mockReturnValue(subscription2Mock);

        ConnectionManager.broadcast(eventName, body, subscriptionId);

        expect(client1Mock.getSubscription).toHaveBeenCalledTimes(1);
        expect(client1Mock.getSubscription).toHaveBeenCalledWith(eventName, subscriptionId);

        expect(client2Mock.getSubscription).toHaveBeenCalledTimes(1);
        expect(client2Mock.getSubscription).toHaveBeenCalledWith(eventName, subscriptionId);

        expect(client1Mock.reply).toHaveBeenCalledTimes(1);
        expect(client1Mock.reply).toHaveBeenCalledWith({
            request: subscription1Mock.request,
            response: {
                status: 200,
                body,
            },
        });

        expect(client2Mock.reply).toHaveBeenCalledTimes(1);
        expect(client2Mock.reply).toHaveBeenCalledWith({
            request: subscription2Mock.request,
            response: {
                status: 200,
                body,
            },
        });
    });
});
