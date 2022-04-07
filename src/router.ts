import {IRoute} from "express";

export type Layer = {
    handle: Function;
    name: string;
    params?: any;
    path?: string;
    route?: IRoute;
    regexp?: RegExp;
};

export default class Router
{
    protected static routes: { [path: string]: Layer } = {};

    public static setRoutesFromStack (stack: Array<Layer>): void
    {
        stack.filter((layer) => layer.route && layer.route.path).map((layer: Layer) => {
            if (!layer.route || !layer.route.path) return;

            this.addRoute(layer);
        });
    }

    public static getRoutes (): { [path: string]: Layer}
    {
        return this.routes;
    }

    public static addRoute (layer: Layer): void
    {
        if (!layer.route) return;
        this.routes[layer.route.path] = layer;
    }

    public static getRoute (path: string): Layer|null
    {
        return this.routes[path] || null;
    }
}
