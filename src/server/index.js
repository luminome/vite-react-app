// server/index.js
import express from "express";
import ViteExpress from "vite-express";
import { readFile } from 'fs/promises';
import bodyParser from 'body-parser';
import api_router from "./api-router.js";

const PORT = process.env.PORT || 3001;
const MODE = process.env.NODE_ENV || 'production';
const package_info = JSON.parse(await readFile(new URL('../../package.json', import.meta.url)));

ViteExpress.config({
    mode: MODE,
    vitePort: 5000,
    printViteDevServerHost: true
});

const app = express();
// app.use(express.static('dist'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api', api_router);


console.log(`\x1b[33mTEST -> ${process.env.TEST_STATE || 'no test'}\x1b[0m`);

ViteExpress.listen(app, PORT, () =>
  console.log(`App (${package_info.name}) ${MODE} server is listening on port ${PORT}`)
);
