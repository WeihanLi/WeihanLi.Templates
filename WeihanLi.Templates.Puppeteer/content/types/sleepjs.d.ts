export = index;
declare function index(time: number): Promise<void>;
declare namespace index {
    // Circular reference from index
    const sleep: any;
    function sleepDays(timeInDays: number): Promise<void>;
    function sleepHours(timeInHours: number): Promise<void>;
    // Circular reference from index
    const sleepMilliseconds: any;
    function sleepMinutes(timeInMinutes: number): Promise<void>;
    function sleepSeconds(timeInSeconds: number): Promise<void>;
}
