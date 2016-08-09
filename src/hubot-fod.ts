// Description
//   Script for interacting with the Fortify on Demand platform
//
// Configuration:
//   HUBOT_FOD_APIKEY (FoD API Key)
//   HUBOT_FOD_APISECRET (FoD API Secret)
//   HUBOT_FOD_BASEURI (optional, only necessary if your account is not located in the US.)
//
// Commands:
//    hubot list apps - Lists applications
//    hubot list releases app <id> - Lists the releases for App <id>
//    hubot list reports app <id> - Lists the last 3 completed reports for App <id>
//    hubot list scans app <id> - Lists the 3 most recent scans for App <id>
//

import {FoDApiHelper} from './util/fod-api-helper';
import * as qs from 'querystring';

function authenticate(msg: any, callback: (err: any, token?: string) => void) {

    const body = qs.stringify({
        grant_type: 'client_credentials',
        scope: 'https://hpfod.com/tenant',
        client_id: process.env.HUBOT_FOD_APIKEY,
        client_secret: process.env.HUBOT_FOD_APISECRET
    });

    msg.http(FoDApiHelper.getApiUri('/oauth/token'))
        .header('Content-Type', 'application/x-www-form-urlencoded')
        .post(body)((err: any, res: any, body: any) => {
            if (err)
                return callback(err);

            switch (res.statusCode) {
                case 200:
                    const responseObject = JSON.parse(body);

                    if (responseObject.access_token) {
                        return callback(null, responseObject.access_token);
                    }

                    return callback('Error authenticating with Fortify on Demand - Authentication Failed');

                default:
                    return callback('Error authenticating with Fortify on Demand - InternalServerError');
            }
        });
}

module.exports = (robot: any) => {

    robot.respond(/(show |list )?(apps|applications)/i, (msg: any) => {

        authenticate(msg, (err, token) => {

            if (err)
                return robot.logger.error(err);

            msg.http(FoDApiHelper.getApiUri('/api/v3/applications'))
                .headers({
                    'authorization': `Bearer ${token}`,
                    'content-type': 'application/octet-stream'
                })
                .get()((err: any, res: any, body: any) => {
                    if (err)
                        return robot.logger.error(err);

                    const parsedBody = JSON.parse(body);

                    if (parsedBody.totalCount) {
                        const items = parsedBody.items.map((item: any) => {
                            return `[${item.applicationId}] -- ${item.applicationName} \
                                    \n${FoDApiHelper.getSiteUri(`/redirect/applications/${item.applicationId}`)}`;
                        });

                        return msg.reply(`\n${items.join('\n')}`);
                    }

                    return msg.reply(`Sorry, I couldn't find anything.`);
                });
        });
    });

    robot.respond(/(show |list )?releases( for)? app (.\d+)/i, (msg: any) => {

        const appId = parseInt(msg.match[3]);
        if (appId) {
            authenticate(msg, (err, token) => {
                if (err)
                    return robot.logger.error(err);

                msg.http(FoDApiHelper.getApiUri(`/api/v3/applications/${appId}/releases`))
                    .headers({
                        'authorization': `Bearer ${token}`,
                        'content-type': 'application/octet-stream'
                    })
                    .get()((err: any, res: any, body: any) => {
                        if (err)
                            return robot.logger.error(err);

                        const parsedBody = JSON.parse(body);

                        if (parsedBody && parsedBody.totalCount) {
                            const items = parsedBody.items.map((item: any) => {
                                return `[${item.releaseId}] [${item.isPassed ? 'PASSING' : 'FAILING'}] -- ${item.releaseName} -- Latest Scan Status: ${item.currentAnalysisStatusType} \
                                        \n${FoDApiHelper.getSiteUri(`/redirect/releases/${item.releaseId}`)}`;
                            });

                            return msg.reply(`Releases for App Id ${appId}: \n${items.join('\n')}`);
                        }

                        return msg.reply(`Sorry, I couldn't find anything.`);
                    });
            });
        }
    });

    robot.respond(/(show |list )?scans( for)? app (.\d+)/i, (msg: any) => {

        const appId = parseInt(msg.match[3]);
        if (appId) {
            authenticate(msg, (err, token) => {
                if (err)
                    return robot.logger.error(err);

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
                            return robot.logger.error(err);

                        switch (res.statusCode) {
                            case 200:

                                const parsedBody = JSON.parse(body);

                                if (parsedBody && parsedBody.totalCount) {
                                    const items = parsedBody.items.map((item: any) => {
                                        return `${item.scanType} Scan  --  Completed On: ${item.completedDateTime} -- ${item.totalIssues} Issues \
                                                \n${FoDApiHelper.getSiteUri()}/redirect/releases/${item.releaseId}`;
                                    });

                                    return msg.reply(`Three most recent scans for App Id ${appId}: \n${items.join('\n')}`);
                                }

                                return msg.reply(`Sorry, I couldn't find anything.`);

                            case 404:
                                return msg.reply(`Sorry, I couldn't find anything.`);
                        }
                    });
            });
        }
    });

    robot.respond(/(show |list )?reports( for)? app (.\d+)/i, (msg: any) => {

        const appId = parseInt(msg.match[3]);
        if (appId) {

            authenticate(msg, (err, token) => {
                if (err)
                    return robot.logger.error(err);

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
                            return robot.logger.error(err);

                        switch (res.statusCode) {
                            case 200:

                                const countResult: number = JSON.parse(body).totalCount || 0;

                                if (countResult > 0) {

                                    const limit = 3;
                                    const q = qs.stringify({
                                        reportStatusTypeId: 2,
                                        applicationId: appId,
                                        offset: countResult - limit,
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
                                                return robot.logger.error(err);

                                            let result = JSON.parse(body);

                                            if (result && result.items) {
                                                let items = result.items.map((item: any) => {
                                                    return `${item.reportName} -- ${item.reportType}\
                                                            \n${FoDApiHelper.getSiteUri(`/reports/downloadreport?reportId=${item.reportId}`)}`;
                                                }).reverse();

                                                return msg.reply(items.join('\n'));
                                            }

                                            return msg.reply(`Sorry, I couldn't find anything.`);
                                        });
                                }
                        }
                    });
            });
        }
    });
};
