jest.mock("../../src/websocket/client");
import ConnectionManager from "../../src/websocket/connectionManager";
import Client from "../../src/websocket/client";
import EventEmitter from "events";
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
});
