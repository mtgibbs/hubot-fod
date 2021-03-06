// Description
//   Script for interacting with the Fortify on Demand platform
//
// Configuration:
//   HUBOT_FOD_APIKEY (FoD API Key)
//   HUBOT_FOD_APISECRET (FoD API Secret)
//   HUBOT_FOD_BASEURI (optional, only necessary if your account is not located in the US.)
//
// Commands:
//    hubot list apps (page <int>)? - Lists applications
//    hubot list (passing|failing)? releases app <id> (page <int>)? - Lists the releases for App <id>
//    hubot list reports app <id> - Lists the last 3 completed reports for App <id>
//    hubot list scans app <id> - Lists the 3 most recent scans for App <id>
//    hubot show issue <id> - Links directly to the given Issue for <id>
//    hubot issues release <id> - Gives the Issue Count breakdown for Release <id>
//
// Author:
//    mtgibbs
//

import {FoDApiHelper, ISeverityCountResult, SeverityType} from './util/fod-api-helper';
import * as qs from 'querystring';
import * as Promise from 'promise';

const authenticate = (msg: any): Promise.IThenable<string> => {

    return new Promise<string>((resolve, reject) => {

        const body = qs.stringify({
            grant_type: 'client_credentials',
            scope: 'api-tenant',
            client_id: process.env.HUBOT_FOD_APIKEY,
            client_secret: process.env.HUBOT_FOD_APISECRET
        });

        msg.http(FoDApiHelper.getApiUri('/oauth/token'))
            .header('Content-Type', 'application/x-www-form-urlencoded')
            .post(body)((err: any, res: any, body: any) => {
                if (err)
                    return reject(err);

                switch (res.statusCode) {
                    case 200:
                        const responseObject = JSON.parse(body);

                        if (responseObject.access_token) {
                            return resolve(responseObject.access_token);
                        }

                        return reject('Error authenticating with Fortify on Demand - Authentication Failed');

                    default:
                        return reject('Error authenticating with Fortify on Demand - InternalServerError');
                }
            });
    });
};

module.exports = (robot: any) => {

    robot.respond(/(show |list )?(apps|applications)( page \d+)?/i, (msg: any) => {

        let pageNo = 1;
        if (msg.match[3]) {
            // unfortunately javascript regex doesn't do lookbehind, so I'm doing this for now     
            pageNo = Math.max(parseInt(msg.match[3].replace(/[a-zA-z\s]+/, '')), 1);
        }

        authenticate(msg)
            .then((token) => {

                return new Promise<string>((resolve, reject) => {

                    const limit = 5;
                    const q = qs.stringify({
                        limit: limit,
                        offset: (pageNo - 1) * limit
                    });

                    const get = msg
                        .http(FoDApiHelper.getApiUri(`/api/v3/applications?${q}`))
                        .headers({
                            'authorization': `Bearer ${token}`,
                            'content-type': 'application/octet-stream'
                        })
                        .get()((err: any, res: any, body: any) => {
                            if (err)
                                return reject(err);

                            const parsedBody = JSON.parse(body);

                            if (parsedBody.totalCount) {
                                const totalPages = Math.floor(parsedBody.totalCount / limit) + 1;
                                const items = parsedBody.items.map((item: any) => {
                                    return `[${item.applicationId}] -- ${item.applicationName} \
                                            \n${FoDApiHelper.getSiteUri(`/redirect/applications/${item.applicationId}`)}`;
                                });

                                return resolve(`Showing page ${pageNo}.  Total Pages: ${totalPages} \
                                                \n${items.join('\n')}`);

                            }

                            return resolve(`Sorry, I couldn't find anything.`);
                        });
                });
            })
            .then((text) => {
                msg.reply(text);
            })
            .catch((err) => {
                robot.logger.error(err);
            });
    });

    robot.respond(/(show |list )?(failing |passing )?releases (for|app|for app) (.\d+)( page \d+)?/i, (msg: any) => {

        let pageNo = 1;
        let isPassing: boolean = null;

        if (msg.match[2])
            isPassing = msg.match[2].trim() === 'passing';

        // unfortunately javascript regex doesn't do lookbehind, so I'm doing this for now
        if (msg.match[5])
            pageNo = Math.max(parseInt(msg.match[5].replace(/[a-zA-z\s]+/, '')), 1);

        const appId = parseInt(msg.match[4]);
        if (appId) {

            authenticate(msg)
                .then((token) => {

                    return new Promise<string>((resolve, reject) => {
                        const limit = 5;

                        const queryObj: any = {
                            limit: limit,
                            offset: (pageNo - 1) * limit
                        };

                        if (isPassing !== null)
                            queryObj.filters = `isPassed:${isPassing}`;

                        const q = qs.stringify(queryObj);

                        msg.http(FoDApiHelper.getApiUri(`/api/v3/applications/${appId}/releases?${q}`))
                            .headers({
                                'authorization': `Bearer ${token}`,
                                'content-type': 'application/octet-stream'
                            })
                            .get()((err: any, res: any, body: any) => {
                                if (err)
                                    return reject(err);

                                const parsedBody = JSON.parse(body);

                                if (parsedBody && parsedBody.totalCount) {
                                    const totalPages = Math.floor(parsedBody.totalCount / limit) + 1;
                                    const appName = parsedBody.items[0].applicationName;
                                    const items = parsedBody.items.map((item: any) => {
                                        return `[${item.releaseId}] [${item.isPassed ? 'PASSING' : 'FAILING'}] -- ${item.releaseName} -- Latest Scan Status: ${item.currentAnalysisStatusType} \
                                                \n${FoDApiHelper.getSiteUri(`/redirect/releases/${item.releaseId}`)}`;
                                    });

                                    return resolve(`Showing page ${pageNo} for [${appId}] -- ${appName}.  Total Pages: ${totalPages} \
                                                    \n${items.join('\n')}`);
                                }

                                return resolve(`Sorry, I couldn't find anything.`);
                            });
                    });

                })
                .then((text) => {
                    msg.reply(text);
                })
                .catch((err) => {
                    robot.logger.error(err);
                });
        }
    });

    robot.respond(/(show |list )?scans (for|app|for app) (.\d+)/i, (msg: any) => {

        const appId = parseInt(msg.match[3]);
        if (appId) {

            authenticate(msg)
                .then((token) => {

                    return new Promise<string>((resolve, reject) => {
                        const q = qs.stringify({
                            limit: 3
                        });

                        msg.http(FoDApiHelper.getApiUri(`/api/v3/applications/${appId}/scans?${q}`))
                            .headers({
                                'authorization': `Bearer ${token}`,
                                'content-type': 'application/octet-stream'
                            })
                            .get()((err: any, res: any, body: any) => {
                                if (err)
                                    return reject(err);

                                switch (res.statusCode) {
                                    case 200:

                                        const parsedBody = JSON.parse(body);

                                        if (parsedBody && parsedBody.totalCount) {
                                            const items = parsedBody.items.map((item: any) => {
                                                return `${item.scanType} Scan  --  Completed On: ${item.completedDateTime} -- ${item.totalIssues} Issues \
                                                        \n${FoDApiHelper.getSiteUri()}/redirect/releases/${item.releaseId}`;
                                            });

                                            return resolve(`Three most recent scans for App Id ${appId}: \n${items.join('\n')}`);
                                        }

                                        return resolve(`Sorry, I couldn't find anything.`);

                                    case 404:
                                        return resolve(`Sorry, I couldn't find anything.`);
                                }
                            });
                    });

                })
                .then((text) => {
                    msg.reply(text);
                })
                .catch((err) => {
                    robot.logger.error(err);
                });
        }
    });

    robot.respond(/(show |list )?reports (for|app|for app) (.\d+)/i, (msg: any) => {

        const appId = parseInt(msg.match[3]);
        if (appId) {

            authenticate(msg)
                .then((token) => {

                    return new Promise<number>((resolve, reject) => {
                        const q = qs.stringify({
                            reportStatusTypeId: 2,
                            applicationId: appId,
                            fields: 'none'
                        });

                        msg.http(FoDApiHelper.getApiUri(`/api/v3/reports?${q}`))
                            .headers({
                                'authorization': `Bearer ${token}`,
                                'content-type': 'application/octet-stream'
                            })
                            .get()((err: any, res: any, body: any) => {
                                if (err)
                                    return reject(err);

                                switch (res.statusCode) {
                                    case 200:

                                        const countResult: number = JSON.parse(body).totalCount || 0;

                                        if (countResult > 0)
                                            return resolve(countResult);
                                }
                            });
                    }).then((count: number) => {

                        return new Promise<string>((resolve, reject) => {
                            const limit = 3;
                            const q = qs.stringify({
                                reportStatusTypeId: 2,
                                applicationId: appId,
                                offset: Math.max(count - limit, 0),
                                limit: limit,
                                orderBy: 'reportId',
                            });

                            msg.http(FoDApiHelper.getApiUri(`/api/v3/reports?${q}`))
                                .headers({
                                    'authorization': `Bearer ${token}`,
                                    'content-type': 'application/octet-stream'
                                })
                                .get()((err: any, res: any, body: any) => {
                                    if (err)
                                        return reject(err);

                                    const result = JSON.parse(body);

                                    if (result && result.items) {
                                        const items = result.items.map((item: any) => {
                                            return `${item.reportName} -- ${item.reportType}\
                                                    \n${FoDApiHelper.getSiteUri(`/reports/downloadreport?reportId=${item.reportId}`)}`;
                                        }).reverse();

                                        return resolve(items.join('\n'));
                                    }

                                    return resolve(`Sorry, I couldn't find anything.`);
                                });
                        });

                    });
                })
                .then((text) => {
                    msg.reply(text);
                })
                .catch((err) => {
                    robot.logger.error(err);
                });
        }
    });

    robot.respond(/(show details|tell me about|details|about|issues) release (.\d+)/i, (msg: any) => {

        const releaseId = parseInt(msg.match[2]);
        if (releaseId) {
            authenticate(msg)
                .then((token) => {

                    const promises: Array<Promise.IThenable<ISeverityCountResult>> = [];

                    [SeverityType.Low, SeverityType.Medium, SeverityType.High, SeverityType.Critical].forEach((severity) => {
                        const q = qs.stringify({
                            fields: 'severityString',
                            limit: 1,
                            filters: `severity:${severity}+isSuppressed:false`,
                            excludeFilters: true
                        });

                        promises.push(
                            new Promise<ISeverityCountResult>((resolve, reject) => {
                                msg.http(FoDApiHelper.getApiUri(`/api/v3/releases/${releaseId}/vulnerabilities?${q}`))
                                    .headers({
                                        'authorization': `Bearer ${token}`,
                                        'content-type': 'application/octet-stream'
                                    })
                                    .get()((err: any, res: any, body: any) => {
                                        if (err)
                                            return reject(err);

                                        const result = JSON.parse(body);

                                        if (result && result.totalCount && result.items) {
                                            return resolve({ severityId: severity, severityType: result.items[0].severityString, count: result.totalCount });
                                        }

                                        return resolve(null);
                                    });
                            }));
                    });

                    return Promise.all(promises);
                })
                .then((result: Array<ISeverityCountResult>) => {
                    if (result && result.some(item => { return item !== null; })) {
                        const severityResults = result
                            .filter(item => { return item !== null; })
                            .sort((a, b) => { return b.severityId - a.severityId; })
                            .map(item => {
                                return `${item.severityType}: ${item.count}`;
                            })
                            .join('\n');

                        return msg.reply(`\nHere is the latest issue breakdown for Release ${releaseId}: \
                                          \n${severityResults}`);
                    }

                    return msg.reply(`There aren't any issues for Release ${releaseId}`);
                })
                .catch((err) => {
                    robot.logger.error(err);
                });
        }
    });

    robot.respond(/(show |list |get |link )?(the )?issue (\d+)/i, (msg: any) => {
        const issueId = msg.match[3];
        if (issueId) {
            authenticate(msg)
                .then((token) => {
                    return new Promise<string>((resolve, reject) => {
                        msg.http(FoDApiHelper.getApiUri(`/api/v3/vulnerabilities/${issueId}`))
                            .headers({
                                'authorization': `Bearer ${token}`,
                                'content-type': 'application/octet-stream'
                            })
                            .get()((err: any, res: any, body: any) => {
                                if (err)
                                    return reject(err);

                                switch (res.statusCode) {
                                    case 200:
                                        return resolve(`${FoDApiHelper.getSiteUri()}/Redirect/Issues/${issueId}`);
                                    default:
                                        return resolve(`Sorry, but I couldn't find Issue ${issueId}.`);
                                }
                            });
                    });
                })
                .then((text) => {
                    msg.reply(text);
                })
                .catch((err) => {
                    robot.logger.error(err);
                });
        }
    });
};
