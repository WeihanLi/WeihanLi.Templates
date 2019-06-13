// 标准输出
export class ApiResponse {
    // 0：没有错误
    // -1：发生异常
    // -400：请求参数异常
    public readonly code: number;
    public readonly msg: string;

    constructor(code: number, msg: string) {
        this.code = code;
        this.msg = msg;
    }

    public static Success(msg: string = ""): ApiResponse {
        return new ApiResponse(0, msg ? msg : "");
    }

    public static RequestError(msg: string, code?: number) {
        return new ApiResponse(code == null ? -400 : code, msg);
    }

    public static Error(msg: string, code?: number): ApiResponse {
        return new ApiResponse(code == null ? -1 : code, msg);
    }
}

// 带输出数据的api返回
export class ApiResponseModel<T> extends ApiResponse {
    private result: T | null = null;
    public get Result(): T | null {
        return this.result;
    }
    public set Result(v: T | null) {
        this.result = v;
    }

    constructor(code: number, msg: string, result?: T) {
        super(code, msg);
        if (result != undefined) {
            this.result = result;
        }
    }

    public static Success<T>(result: T, msg: string = ""): ApiResponseModel<T> {
        return new ApiResponseModel(0, msg ? msg : "", result);
    }

    public static Error<T>(msg: string, code: number = -1, result?: T): ApiResponseModel<T> {
        return new ApiResponseModel(-1, msg, result);
    }
}