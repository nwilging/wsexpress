import Client from "../../src/websocket/client";
import {ClientResponse} from "../../src/websocket/server";
import {EventEmitter} from "events";

describe ('test websocket client', () => {
    test ('test instantiation binds websocket listeners', () => {
        const wsMock: any = {
            on: jest.fn(),
        };

        const requestMock: any = {};

        const client = new Client(wsMock, requestMock);

        expect(client.getUpgradeRequest()).toBe(requestMock);
        expect(wsMock.on).toHaveBeenCalledTimes(2);
        expect(wsMock.on).toHaveBeenCalledWith('message', expect.any(Function));
        expect(wsMock.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    test ('test get address information', () => {
        const wsMock: any = {
            on: jest.fn(),
        };

        const requestMock: any = {
            socket: {
                remoteAddress: '127.0.0.1',
                remotePort: 12345,
            },
        };

        const client = new Client(wsMock, requestMock);

        expect(client.getAddress()).toBe(requestMock.socket.remoteAddress);
        expect(client.getPort()).toBe(requestMock.socket.remotePort);
        expect(client.clientAddress()).toBe('127.0.0.1:12345');
    });

    test ('test close calls websocket terminate', () => {
        const wsMock: any = {
            on: jest.fn(),
            terminate: jest.fn(),
        };

        const requestMock: any = {};

        const client = new Client(wsMock, requestMock);
        client.close();

        expect(wsMock.terminate).toHaveBeenCalledTimes(1);
    });

    test ('test reply serializes message as json', () => {
        const wsMock: any = {
            on: jest.fn(),
            send: jest.fn(),
        };

        const requestMock: any = {};

        const message: ClientResponse = {
            request: {
                type: 'route',
                message: {
                    route: '/',
                    method: 'get',
                },
            },
            response: {
                status: 200,
            },
        };
        const expectedMessage = JSON.stringify(message);

        const client = new Client(wsMock, requestMock);
        client.reply(message);

        expect(wsMock.send).toHaveBeenCalledTimes(1);
        expect(wsMock.send).toHaveBeenCalledWith(expectedMessage);
    });

    test ('test emits message event when websocket receives message', () => {
        const wsMock: any = new class extends EventEmitter {};
        const requestMock: any = {
            socket: {},
        };

        const client = new Client(wsMock, requestMock);
        const messageEmitted = jest.fn();

        client.on('message', messageEmitted);

        const expectedMessage = {};
        wsMock.emit('message', expectedMessage);

        expect(messageEmitted).toHaveBeenCalledTimes(1);
        expect(messageEmitted).toHaveBeenCalledWith(client, expectedMessage);
    });

    test ('test emits disconnect on websocket close', () => {
        const wsMock: any = new class extends EventEmitter {};
        const requestMock: any = {
            socket: {},
        };

        const client = new Client(wsMock, requestMock);
        const closeEmitted = jest.fn();

        client.on('disconnect', closeEmitted);
        wsMock.emit('close');

        expect(closeEmitted).toHaveBeenCalledTimes(1);
        expect(closeEmitted).toHaveBeenCalledWith(client);
    });

    test ('test add subscription adds subscription', () => {
        const wsMock: any = new class extends EventEmitter {};
        const requestMock: any = {};

        const client = new Client(wsMock, requestMock);
        const eventName = 'test-event';

        expect(client.getSubscription(eventName)).toBeNull();

        const subscription = {
            eventName,
            request: requestMock,
        };
        client.addSubscription(subscription);

        expect(client.getSubscription(eventName)).toBe(subscription);
    });

    test ('test add subscription does not add subscription if it already exists', () => {
        const wsMock: any = new class extends EventEmitter {};
        const requestMock: any = {};

        const client = new Client(wsMock, requestMock);
        const eventName = 'test-event';

        // @ts-ignore
        expect(client.subscriptions).toEqual([]);

        const subscription = {
            eventName,
            request: requestMock,
        };

        client.addSubscription(subscription);
        client.addSubscription(subscription);

        expect(client.getSubscription(eventName)).toBe(subscription);
        // @ts-ignore
        expect(client.subscriptions).toHaveLength(1);
    });

    test ('test add subscription adds duplicate subscription with subscriptionId specified', () => {
        const wsMock: any = new class extends EventEmitter {};
        const requestMock: any = {};

        const client = new Client(wsMock, requestMock);
        const eventName = 'test-event';

        // @ts-ignore
        expect(client.subscriptions).toEqual([]);

        const subscription1 = {
            eventName,
            request: requestMock,
        };

        const subscription2 = {
            eventName,
            subscriptionId: 'test-id',
            request: requestMock,
        };

        client.addSubscription(subscription1);
        client.addSubscription(subscription2);

        expect(client.getSubscription(eventName)).toBe(subscription1);
        expect(client.getSubscription(eventName, 'test-id')).toBe(subscription2);

        // @ts-ignore
        expect(client.subscriptions).toHaveLength(2);
    });
});
