import { Page } from "puppeteer";
import { ApiResponse } from './ApiResponse';

export class CrawlerRequest {
    //    
    private _jobId: number = 0;
    public get jobId(): number {
        return this._jobId;
    }
    public set jobId(v: number) {
        this._jobId = v;
    }

    private _jobName: string = "";
    public get jobName(): string {
        return this._jobName;
    }
    public set jobName(v: string) {
        this._jobName = v;
    }
    
    private _doJob: (page: Page, taskId: string) => Promise<ApiResponse> = (page,taskId) => Promise.resolve(ApiResponse.Success());
    public get doJob(): (page: Page, taskId: string) => Promise<ApiResponse> {
        return this._doJob;
    }
    public set doJob(v: (page: Page, taskId: string) => Promise<ApiResponse>) {
        this._doJob = v;
    }


    // private _keywordsId: number = 0;
    // public get keywordsId(): number {
    //     return this._keywordsId;
    // }
    // public set keywordsId(v: number) {
    //     this._keywordsId = v;
    // }

    // private _totalPage: number = 1;
    // public get totalPage(): number {
    //     return this._totalPage;
    // }
    // public set totalPage(v: number) {
    //     this._totalPage = v;
    // }

    // private _crawlerType: number = 1;
    // public get crawlerType(): number {
    //     return this._crawlerType;
    // }
    // public set crawlerType(v: number) {
    //     this._crawlerType = v;
    // }
}