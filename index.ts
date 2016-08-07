/// <reference path="typings/index.d.ts" />

import * as fs from 'fs';
import * as path from 'path';

module.exports = (robot: any, scripts: any) => {

    let scriptsPath = path.resolve(__dirname, 'src');
    fs.exists(scriptsPath, (exists) => {
        if (exists) {
            
            // This is boilerplate copied and translated to TS from the coffee hubot examples
            let dir = fs.readdirSync(scriptsPath);
            dir.forEach((script) => {
                if (scripts && scripts.indexOf('*') < 0 && scripts.indexOf(script) >= 0) {
                    robot.loadFile(scriptsPath, script);
                } else if (script.indexOf('fod-api-helper') < 0) {
                    robot.loadFile(scriptsPath, script);
                }
            });

        }
    });
}