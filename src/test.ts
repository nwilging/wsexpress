import {NextFunction, Request, Response} from "express";
import {wsExpress, listen} from "./index";

const express = require("express");

const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({});
});

app.get('/test', (req: Request, res: Response) => {
    res.status(201).json({});
});

app.use(wsExpress({ app }));

listen({ app }, 8080, () => {
    console.log('listening');
});
