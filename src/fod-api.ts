/// <reference path="../typings/index.d.ts" />

import request = require('request');

export class FoDApi {

    private _protocol: string = 'https'; // this could be configurable later if the bot developer was testing locally
    private _baseUri: string = 'hpfod.com';

    constructor(baseUri?: string) {
        if (baseUri)
            this._baseUri = baseUri;
    }

    private getApiUri(): string {
        return `${this._protocol}://api.${this._baseUri}`;
    }

    private getSiteUri(): string {
        return `${this._protocol}://${this._baseUri}`;
    }

    public getAccessToken(cb: (err: any, token?: string) => void): void {

        let uri = `${this.getApiUri()}/oauth/token`;

        let postData = {
            'scope': 'https://hpfod.com/tenant',
            'grant_type': 'client_credentials',
            'client_id': process.env.HUBOT_FOD_APIKEY,
            'client_secret': process.env.HUBOT_FOD_APISECRET
        };

        let requestOptions = {
            uri: uri,
            method: 'POST',
            form: postData,
            proxy: '',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        request(requestOptions, (err, response, body) => {
            if (err) {
                cb(err);
                return;
            }

            switch (response.statusCode) {
                case 200:
                    var responseObject = JSON.parse(body);

                    if (responseObject.access_token) {
                        cb(null, responseObject.access_token)
                    }
                    else {
                        cb('Error authenticating with Fortify on Demand - Authentication Failed');
                    }

                    break;
                default:
                    cb('Error authenticating with Fortify on Demand - InternalServerError');
                    break;
            }
        });
    }

    public getApplications(callback: (err: any, message?: string) => void) {
        this.getAccessToken((err, token) => {

            if (err) {
                callback(err);
                return;
            }

            let requestOptions = {
                uri: `${this.getApiUri()}/api/v3/applications`,
                method: 'GET',
                headers: {
                    'authorization': ['Bearer', token].join(' '),
                    'content-type': 'application/octet-stream'
                }
            };

            request(requestOptions, (err, response, body) => {
                if (err) {
                    callback(err);
                }

                let bodyJSON = JSON.parse(body);

                if (bodyJSON.totalCount > 0) {
                    let x = bodyJSON.items.map((item: any) => {
                        return `${item.applicationId}) ${item.applicationName}`;
                    });

                    callback(null, `\n${x.join('\n')}`);
                } else {
                    callback(null, 'Sorry, I couldn\'t find anything');
                }
            });
        });
    }

    public getReleases(appId: number, callback: (err: any, message?: string) => void) {
        this.getAccessToken((err, token) => {
            if (err) {
                callback(err);
                return;
            }

            let requestOptions = {
                uri: `${this.getApiUri()}/api/v3/applications/${appId}/releases`,
                method: 'GET',
                headers: {
                    'authorization': ['Bearer', token].join(' '),
                    'content-type': 'application/octet-stream'
                }
            };

            request(requestOptions, (err, response, body) => {
                if (err) {
                    callback(err);
                    return;
                }

                let bodyJSON = JSON.parse(body);

                if (bodyJSON && bodyJSON.totalCount > 0) {
                    let x = bodyJSON.items.map((item: any) => {
                        return `${item.releaseId}) ${item.releaseName} [${item.isPassed ? 'PASSING' : 'FAILING'}]`;
                    });
                    callback(null, `\n${x.join('\n')}`);
                } else {
                    callback(null, 'I couldn\'t find anything.  Did you try to see something you shouldn\'t have?');
                }
            });
        });
    }

    public getScansForApp(appId: number, callback: (err: any, message?: string) => void) {
        this.getAccessToken((err, token) => {
            if (err) {
                callback(err);
                return;
            }

            let requestOptions = {
                uri: `${this.getApiUri()}/api/v3/applications/${appId}/scans?limit=3`,
                method: 'GET',
                headers: {
                    'authorization': ['Bearer', token].join(' '),
                    'content-type': 'application/octet-stream'
                }
            };

            request(requestOptions, (err, res, body) => {
                if (err) {
                    return callback(err);
                }

                switch (res.statusCode) {
                    case 200:

                        let result = JSON.parse(body);

                        if (!result) {
                            return callback(null, `Sorry.  I couldn't find anything.`);
                        }

                        if (result.totalCount < 1) {
                            return callback(null, `No scans found for app id ${appId}.`);
                        }

                        let message = result.items.map((item: any) => {
                            return `${item.scanType} Scan  --  Completed On: ${item.completedDateTime} -- ${item.totalIssues} Issues\n
                                        ${this.getSiteUri()}/redirect/releases/${item.releaseId}`;
                        });

                        return callback(null, message);

                    case 404:
                        return callback(null, `Sorry.  I couldn't find anything.`);

                    default:
                        return callback(`API returned status code: ${res.statusCode}`);

                }

            });
        });
    }
}
