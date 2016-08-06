/// <reference path="../typings/index.d.ts" />

import * as request from 'request';

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

    private buildGetRequest(token: string, uri: string): request.UriOptions & request.CoreOptions {
        return {
            uri: uri,
            method: 'GET',
            headers: {
                'authorization': ['Bearer', token].join(' '),
                'content-type': 'application/octet-stream'
            }
        };
    }

    public getAccessToken(callback: (err: any, token?: string) => void): void {

        let postData = {
            'scope': 'https://hpfod.com/tenant',
            'grant_type': 'client_credentials',
            'client_id': process.env.HUBOT_FOD_APIKEY,
            'client_secret': process.env.HUBOT_FOD_APISECRET
        };

        let requestOptions = {
            uri: `${this.getApiUri()}/oauth/token`,
            method: 'POST',
            form: postData,
            proxy: '',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

        request(requestOptions, (err, response, body) => {
            if (err)
                return callback(err);

            switch (response.statusCode) {
                case 200:
                    let responseObject = JSON.parse(body);

                    if (responseObject.access_token) {
                        return callback(null, responseObject.access_token);
                    }

                    return callback('Error authenticating with Fortify on Demand - Authentication Failed');

                default:
                    return callback('Error authenticating with Fortify on Demand - InternalServerError');
            }
        });
    }

    public getApplications(callback: (err: any, message?: string) => void) {
        this.getAccessToken((err, token) => {

            if (err)
                return callback(err);

            let requestOptions = this.buildGetRequest(token, `${this.getApiUri()}/api/v3/applications`);

            request(requestOptions, (err, response, body) => {
                if (err)
                    return callback(err);

                let bodyJSON = JSON.parse(body);

                if (bodyJSON.totalCount > 0) {
                    let items = bodyJSON.items.map((item: any) => {
                        return `[${item.applicationId}] -- ${item.applicationName} \
                                \n${this.getSiteUri()}/redirect/applications/${item.applicationId}`;
                    });

                    return callback(null, `\n${items.join('\n')}`);
                }

                return callback(null, `Sorry, I couldn't find anything`);
            });
        });
    }

    public getReleases(appId: number, callback: (err: any, message?: string) => void) {
        this.getAccessToken((err, token) => {
            if (err)
                return callback(err);

            let requestOptions = this.buildGetRequest(token, `${this.getApiUri()}/api/v3/applications/${appId}/releases`);

            request(requestOptions, (err, response, body) => {
                if (err)
                    return callback(err);

                let bodyJSON = JSON.parse(body);

                if (bodyJSON && bodyJSON.totalCount > 0) {
                    let x = bodyJSON.items.map((item: any) => {
                        return `[${item.releaseId}] [${item.isPassed ? 'PASSING' : 'FAILING'}] -- ${item.releaseName} -- Latest Scan Status: ${item.currentAnalysisStatusType} \
                                \n${this.getSiteUri()}/redirect/releases/${item.releaseId}`;
                    });
                    return callback(null, `\n${x.join('\n')}`);
                }

                return callback(null, 'I couldn\'t find anything.  Did you try to see something you shouldn\'t have?');
            });
        });
    }

    public getScansForApp(appId: number, callback: (err: any, message?: string) => void) {
        this.getAccessToken((err, token) => {
            if (err)
                return callback(err);


            let requestOptions = this.buildGetRequest(token, `${this.getApiUri()}/api/v3/applications/${appId}/scans?limit=3`);

            request(requestOptions, (err, res, body) => {
                if (err)
                    return callback(err);

                switch (res.statusCode) {
                    case 200:

                        let result = JSON.parse(body);

                        if (!result) {
                            return callback(null, `Sorry.  I couldn't find anything.`);
                        }

                        if (result.totalCount < 1) {
                            return callback(null, `No scans found for app id ${appId}.`);
                        }

                        let items = result.items.map((item: any) => {
                            return `${item.scanType} Scan  --  Completed On: ${item.completedDateTime} -- ${item.totalIssues} Issues \
                                        \n${this.getSiteUri()}/redirect/releases/${item.releaseId}`;
                        });

                        return callback(null, items.join('\n\n'));

                    case 404:
                        return callback(null, `Sorry.  I couldn't find anything.`);

                    default:
                        return callback(`API returned status code: ${res.statusCode}`);
                }
            });
        });
    }

    public getReportsForApp(appId: number, callback: (err: any, message?: string) => void) {
        this.getAccessToken((err, token) => {
            if (err)
                return callback(err);

            let requestOptions = this.buildGetRequest(token, `${this.getApiUri()}/api/v3/reports?filters=applicationId%3A${appId}%2BreportStatusTypeId%3A2&fields=none`);

            request(requestOptions, (err, res, body) => {
                if (err)
                    return callback(err);

                switch (res.statusCode) {
                    case 200:

                        let countResult = JSON.parse(body);

                        if (countResult && countResult.totalCount) {
                            const limit = 3;
                            requestOptions = this.buildGetRequest(token, `${this.getApiUri()}/api/v3/reports?applicationId%3A${appId}}%2BreportStatusTypeId%3A2&orderBy=reportId&offset=${countResult.totalCount - limit}&limit=${limit}`);
                            return request(requestOptions, (err, res, body) => {
                                if (err)
                                    return callback(err);

                                switch (res.statusCode) {
                                    case 200:

                                        let result = JSON.parse(body);

                                        if (result && result.items) {
                                            var items = result.items.map((item: any) => {
                                                return `${item.reportName} -- ${item.reportType}\
                                                        \n${this.getSiteUri()}/reports/downloadreport?reportId=${item.reportId}`;
                                            }).reverse();

                                            return callback(null, items.join('\n'));
                                        }
                                    default:
                                        return callback(`API returned status code: ${res.statusCode}`);
                                }
                            });
                        }

                        return callback(null, 'No reports for that application.');

                    default:
                        return callback(`API returned status code: ${res.statusCode}`);
                }
            });
        });
    }
}
