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
}