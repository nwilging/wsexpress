jest.mock("../src/router");
jest.mock("../src/websocket/server");
import {wsExpress, listen} from "../src";
import Router from "../src/router";
import Server from "../src/websocket/server";

describe ('test module instantiation', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test ('test wsExpress middleware sets routes from express application', () => {
        const appMock: any = {
            _router: {
                stack: [1, 2, 3],
            },
        };

        wsExpress({ app: appMock });
        expect(Router.setRoutesFromStack).toHaveBeenCalledTimes(1);
        expect(Router.setRoutesFromStack).toHaveBeenCalledWith(appMock._router.stack);
    });

    test ('test wsExpress middleware returns custom requestHandler', () => {
        const appMock: any = {
            _router: {
                stack: [1, 2, 3],
            },
        };

        const requestHandler = () => true;
        const result = wsExpress({ app: appMock, requestHandler });

        expect(result).toBe(requestHandler);
        expect(Router.setRoutesFromStack).toHaveBeenCalledTimes(1);
        expect(Router.setRoutesFromStack).toHaveBeenCalledWith(appMock._router.stack);
    });

    test ('test listen calls app.listen and Server.initialize', () => {
        const appMock: any = {
            listen: jest.fn(),
        };

        const mockHttpServer: any = {};
        appMock.listen.mockReturnValue(mockHttpServer);

        const expectedPort = 8080;
        const expectedCallback = () => true;

        listen({ app: appMock }, expectedPort, expectedCallback);

        expect(appMock.listen).toHaveBeenCalledTimes(1);
        expect(appMock.listen).toHaveBeenCalledWith(expectedPort, expectedCallback);
        expect(Server.initialize).toHaveBeenCalledTimes(1);
        expect(Server.initialize).toHaveBeenCalledWith(appMock, mockHttpServer);
    });
});
