/// <reference path="../typings/index.d.ts" />

import {FoDApi} from './fod-api';
import request = require('request');

module.exports = (robot: any) => {

    robot.respond(/(show|list) (apps|applications)/i, (msg: any) => {
        let api = new FoDApi(process.env.HUBOT_FOD_BASEURI);

        api.getApplications((err: any, message: string) => {
            if (err) {
                robot.logger.error(err);
                msg.reply(err);
                return;
            }

            msg.reply(message);
        });
    });

    robot.respond(/(show|list) releases (.\d+)/i, (res: any) => {

        let appId = parseInt(res.match[2]);

        if (appId > 0) {
            let api = new FoDApi(process.env.HUBOT_FOD_BASEURI);
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
