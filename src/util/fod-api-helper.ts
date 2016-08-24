/// <reference path="../../typings/index.d.ts" />

export class FoDApiHelper {

    private static _DEFAULT_URI: string = 'hpfod.com';
    private static _DEFAULT_PROTOCOL: string = 'https';

    public static getApiUri(path?: string): string {
        let uri = `${this._DEFAULT_PROTOCOL}://api.${process.env.HUBOT_FOD_BASEURI || this._DEFAULT_URI}`;
        if (path)
            uri += path;
        return uri;
    }

    public static getSiteUri(path?: string): string {
        let uri = `${this._DEFAULT_PROTOCOL}://${process.env.HUBOT_FOD_BASEURI || this._DEFAULT_URI}`;
        if (path)
            uri += path;
        return uri;
    }
}

export interface ISeverityCountResult {
    severityId: number;
    severityType: string;
    count: number;
}

export enum SeverityType {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
    BestPractice = -1,
    Info = -2
}
