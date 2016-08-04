/// <reference path="../typings/index.d.ts" />

import {FoDApi} from './fod-api';
import request = require('request');

module.exports = (robot: any) => {

    robot.respond(/show me my apps/i, (msg: any) => {
        let api = new FoDApi();

        api.getApplications((err: any, message: string) => {
            if (err) {
                robot.logger.error(err);
                msg.reply(err);
                return;
            }

            msg.reply(message);
        });
    });

    robot.respond(/show me the releases for app id (.\d+)/i, (res: any) => {

        let appId = parseInt(res.match[1]);

        if (appId > 0) {
            let api = new FoDApi();
            api.getReleases(appId, (err, message) => {
                if (err) {
                    robot.logger.error(err);
                    res.reply(err);
                    return;
                }

                res.reply(`Here are the releases for App Id ${appId}: \n ${message}`);
            });
        }
    });
}