import * as moment from 'moment';
import { DbUtil as dbUtil } from './utils/dbUtil';

import { Page, Browser } from 'puppeteer';
import * as puppeteer from 'puppeteer';

import * as log4js from "log4js";
import * as fs from 'fs';
import * as AsyncLock from "async-lock";
import { ApiResponse, ApiResponseModel } from './models/ApiResponse';

import { Guid } from "guid-typescript";
import { TaskStatus } from './models/TaskStatus';
import { CrawlerRequest } from './models/CrawlerRequest';
import { sleep, sleepSeconds } from 'sleepjs';

const logger = log4js.getLogger("Main");
const UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36";
const lock = new AsyncLock({ timeout: 1000 });

export class Main {
  private static browser: Browser;  

  public static CrawlerRequestQueue: Map<string, CrawlerRequest> = new Map<string, CrawlerRequest>();
  public static Tasks: Map<string, ApiResponseModel<TaskStatus>> = new Map<string, ApiResponseModel<TaskStatus>>();

  private static async PuppeteerPageInterceptor(target: puppeteer.Target): Promise<void> {
    if (target.type() != "page") {
      return;
    }
    try {
      const page = await target.page();
      page.setDefaultNavigationTimeout(60000 * 5);
      await page.setUserAgent(UserAgent);
      let preloadJs = `Object.defineProperty(navigator, "webdriver", {
        get: function() {
          return undefined;
        }
      });`;//fs.readFileSync(Constants.PreloadScriptPath, "utf8");
      await page.evaluate(preloadJs);
    } catch (error) {
      logger.error(`pageInterceptor invoke failed,error: ${error}`);
    }
  }

  private static async _execJob(jobId: number, jobName: string, doJob: (page: Page, taskId: string) => Promise<ApiResponse>): Promise<ApiResponseModel<string>> {
    let noJobRelated = false;
    if (Number.isNaN(jobId) || jobId <= 0) {
      noJobRelated = true;
    }

    // if (!noJobRelated) {
    //   var result = await dbUtil.query(`SELECT Status FROM Jobs WHERE Id = ${jobId}`);
    //   if (result.recordset.length == 0) {
    //     logger.warn(`job do not exists, jobId: ${jobId}, ${jobName}, return back`);
    //     return ApiResponseModel.Error<string>(`job 不存在, jobId: ${jobId}`, -1001);
    //   }
    // } else {
    //   jobId = -Date.now();
    // }

    if (!this.browser) {
      logger.debug(`browser not created, lock busy: ${lock.isBusy("browserCreated")}`);
      await lock.acquire("browserCreated", async () => {
        logger.debug(`init browser, lock busy: ${lock.isBusy("browserCreated")}`);
        if (!this.browser) {
          let puppeteerOption: puppeteer.LaunchOptions = {
            ignoreHTTPSErrors: true, // ignore https error
            headless: false,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
            ],
            defaultViewport: {
              width: 1366,
              height: 768
            }
          };
          let headless = process.env.PUPPETEER_HEADLESS == 'true';
          if (headless) {
            puppeteerOption.headless = true;
          }
          let skipDownPuppeteer = process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD == 'true';
          if (skipDownPuppeteer) {
            puppeteerOption.executablePath = "google-chrome"; // for PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true
          }
          logger.debug(`puppeteerOption: ${JSON.stringify(puppeteerOption)}`);
          this.browser = await puppeteer.launch(puppeteerOption);
          this.browser.defaultBrowserContext().on("targetcreated", this.PuppeteerPageInterceptor);
          this.ExecuteJob();
        }
      });
    }

    logger.info(`exec job ${jobName} started, jobId: ${jobId}`);

    if (this.CrawlerRequestQueue.size > 10) {
      logger.debug(`job too much..., can not exec in parallel more than 10`);
      return ApiResponseModel.Error<string>("已有爬取任务正在执行", -1000);
    }

    let taskId = Guid.create().toString();

    var request = new CrawlerRequest();
    request.doJob = doJob;
    request.jobId = jobId;
    request.jobName = jobName;
    this.CrawlerRequestQueue.set(taskId, request);

    this.Tasks.set(taskId, ApiResponseModel.Success(TaskStatus.Queued, "Queued"));

    logger.info(`job ${jobId} ${jobName} returned, taskId: ${taskId}`);
    return ApiResponseModel.Success(taskId);
  }

  public static async search(jobId: number, keywordsId: number, crawlerType: number, totalPage: number = 10): Promise<ApiResponseModel<string>> {
    logger.debug(`request info: jobId:${jobId},keywordsId:${keywordsId}, totalPage:${totalPage}, crawlerType:${crawlerType}`);
    let result = await this._execJob(jobId, `${crawlerType === 2 ? "知乎" : "悟空问答"} search`, async (page, taskId) => {
      // let crawler: BaseCrawler;
      // if (crawlerType === 2) {
      //   crawler = new ZhihuCrawler(page, taskId);
      // } else {
      //   crawler = new WukongCrawler(page, taskId);
      // }
      // return await crawler.Execute(jobId, keywordsId, totalPage);
      return await Promise.resolve(ApiResponseModel.Success("123456"));
    });
    return result;
  }

  private static async ExecuteJob(): Promise<void> {
    logger.debug(`execute job started`);
    while (true) {
      let queueSize = this.CrawlerRequestQueue.size;
      logger.debug(`this.CrawlerRequestQueue size: ${queueSize}`);
      if (queueSize > 0) {
        let taskIds = Array.from(this.CrawlerRequestQueue.keys());
        for (let i = 0; i < taskIds.length; i++) {
          let taskId = taskIds[i];
          var request = this.CrawlerRequestQueue.get(taskId);
          if (request === undefined) {
            continue;
          } else {
            let task = this.Tasks.get(taskId);
            if (task === undefined) {
              continue;
            }
            if (task.Result != TaskStatus.Queued) {
              continue;
            }
            logger.debug(`jobId: ${request.jobId}, jobName: ${request.jobName}, taskStatus:${task.Result}`);
            //
            let browserContext = await this.browser.createIncognitoBrowserContext();
            browserContext.on("targetcreated", this.PuppeteerPageInterceptor);
            let page = await browserContext.newPage();
            logger.info(`taskId: ${taskId}, begin exec job, jobId: ${request.jobId}, taskId: ${taskId}`);
            this.Tasks.set(taskId, ApiResponseModel.Success(TaskStatus.Running));
            try {
              let jobResult = await request.doJob(page, taskId);
              logger.info(`exec job ${request.jobName} completed, jobId: ${request.jobId}, taskId: ${taskId}, jobResult: ${JSON.stringify(jobResult)}`);
              if (jobResult.code === 0) {
                this.Tasks.set(taskId, ApiResponseModel.Success(TaskStatus.Success, jobResult.msg));
              } else {
                this.Tasks.set(taskId, ApiResponseModel.Error(jobResult.msg, jobResult.code, TaskStatus.Error));
              }
            }
            catch (error) {
              logger.error(`exec job ${request.jobName} failed, jobId: ${request.jobId}, taskId: ${taskId}, err:${error}`);
              this.Tasks.set(taskId, ApiResponseModel.Success(TaskStatus.Error, `error: ${error}`));
            }
            finally {
              logger.info(`close page for job ${request.jobName}, jobId: ${request.jobId}, taskId: ${taskId}`);
              // remove task from queue
              this.CrawlerRequestQueue.delete(taskId);

              try {
                if (!page.isClosed()) {
                  await page.close();
                }
                await browserContext.close();
              } catch (error) {
                logger.error(`close page error, ${error}`);
              }
            }
          }
        }

      }
      logger.debug(`no more jobs in queue, sleep for 5s`);
      await sleep(5000);
    }
  }
}