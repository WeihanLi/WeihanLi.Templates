import { configure, getLogger, connectLogger } from "log4js";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import { ApiResponse } from './models/ApiResponse';
import { Main } from './main';

import { serve as swaggerServe, setup as swaggerSetup } from 'swagger-ui-express';
import * as swaggerDoc from "./swagger.json";
import { Guid } from 'guid-typescript';

// config log4js
configure({
  appenders: {
    file: {
      type: 'file',
      filename: './logs/crawler.log',
      maxLogSize: 1024000,
      backups: 10
    },
    errorFile: {
      type: "file",
      filename: "./logs/errors.log"
    },
    errors: {
      type: "logLevelFilter",
      level: "ERROR",
      appender: "errorFile"
    },
    httpLog: {
      type: 'file',
      filename: './logs/http.log',
      maxLogSize: 204800,
      backups: 3
    },
    dbUtil: {
      type: 'file',
      filename: './logs/dbUtil.log',
      maxLogSize: 1024000,
      backups: 3
    },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['file', 'console', 'errors'], level: 'debug' },
    dbUtil: { appenders: ['dbUtil'], level: 'debug' },
    http: { appenders: ['httpLog'], level: 'debug' }
  }
});

const logger = getLogger("index");

let app = express();

app.use(express.static("logs")); // log
app.use(bodyParser.json()); // add support application/json
app.use(cors()); // cors config

app.use(connectLogger(getLogger("http"), {
  level: 'auto',
  format: (req, res, formatter) =>
    (res.statusCode == 404 || res.statusCode == 304)
      ? ""
      : formatter(`${res.statusCode} :remote-addr - ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent", request body: ${JSON.stringify(req.body)}`)
}));

app.use('/api-docs', swaggerServe, swaggerSetup(swaggerDoc));

app.get("/", (req, res) => {
  res.json(ApiResponse.Success("TProjectName crawler"));
});

app.get("/tasks", (req, res)=>{
  res.json(Array.from(Main.Tasks.entries()));
});

app.get("/tasks/:taskId", (req, res) => {
  let taskId = req.params.taskId;  
  if (!taskId) {
    res.status(400).json(ApiResponse.RequestError("taskId不能为空"));
  }
  if (!Guid.isGuid(taskId)) {
    res.status(400).json(ApiResponse.RequestError(`请求参数异常，taskId: ${taskId}`));
  }
  if (Main.Tasks.has(taskId)) {
    res.json(Main.Tasks.get(taskId));
  } else {
    res.status(400).json(ApiResponse.RequestError("taskId不存在"));
  }
});

app.delete("/tasks/:taskId", (req, res) => {
  let taskId = req.params.taskId;
  if (!taskId) {
    res.status(400).json(ApiResponse.RequestError("taskId不能为空"));
  }
  if (!Guid.isGuid(taskId)) {
    res.status(400).json(ApiResponse.RequestError(`请求参数异常，taskId: ${taskId}`));
  }
  if (Main.Tasks.has(taskId)) {
    Main.Tasks.delete(taskId);
    res.json(ApiResponse.Success());
  } else {
    res.status(400).json(ApiResponse.RequestError("taskId不存在"));
  }
});

app.post("/search", async (req, res) => {
  logger.debug(`search request body: ${JSON.stringify(req.body)}`);

  let jobId = parseInt(req.body.jobId);
  let keywordsId = parseInt(req.body.keywordsCombinationId);
  let totalPage = parseInt(req.body.totalPage);
  let crawlerType = parseInt(req.body.crawlerType);

  if (Number.isNaN(keywordsId) || keywordsId <= 0) {
    return res.status(400).json(ApiResponse.RequestError(`请求参数异常，关键词组合id无效`));
  }
  if (totalPage <= 0) {
    totalPage = 2;
  }

  logger.debug(`request info: jobId:${jobId},keywordsId:${keywordsId}, totalPage:${totalPage}`);

  let result = await Main.search(
    Number.isNaN(jobId) ? -Date.now() : jobId,
    Number.isNaN(keywordsId) ? -1 : keywordsId,
    Number.isNaN(crawlerType) ? 1 : crawlerType,
    Number.isNaN(totalPage) ? 10 : totalPage);
  if (result.code === 0) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

app.listen(3000, () => { console.log('app started with listening port 3000'); });