import Router from "../src/router";

describe ('test router', () => {
    test ('test setRoutesFromStack sets routes appropriately', () => {
        const route1 = {
            route: { path: '/path1' },
        };
        const route2 = {
            route: {},
        };
        const route3 = {
            route: { path: '/path2' },
        };
        const route4 = {};

        const stack: any = [route1, route2, route3, route4];

        Router.setRoutesFromStack(stack);

        const routes = Router.getRoutes();
        expect(routes).toEqual({
            '/path1': route1,
            '/path2': route3,
        });
    });

    test ('test getRoute returns route successfully', () => {
        const route1 = {
            route: { path: '/path1', methods: { get: true }},
        };
        const route2 = {
            route: { path: '/test-path', methods: { get: true }},
        };

        const stack: any = [route1, route2];

        Router.setRoutesFromStack(stack);

        const foundRoute = Router.getRoute('/test-path', 'GET');
        expect(foundRoute).toBe(route2);
    });

    test ('test getRoute returns null when route exists but method not valid', () => {
        const route1 = {
            route: { path: '/path1', methods: { get: false, post: true }},
        };
        const route2 = {
            route: { path: '/test-path', methods: { get: false, post: true }},
        };

        const stack: any = [route1, route2];

        Router.setRoutesFromStack(stack);

        const foundRoute = Router.getRoute('/test-path', 'GET');
        expect(foundRoute).toBeNull();
    });
});
