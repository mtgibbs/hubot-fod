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
