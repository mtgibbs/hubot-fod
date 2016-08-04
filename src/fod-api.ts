/// <reference path="../typings/index.d.ts" />

import request = require('request');

export class FoDApi {

    constructor() { }

    public getAccessToken(cb: (err: any, token?: string) => void): void {

        let uri = 'https://api.hpfod.com/oauth/token';

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
                uri: 'https://api.hpfod.com/api/v3/applications',
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
}