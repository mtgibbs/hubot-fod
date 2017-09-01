# hubot-fod
Hubot Script for interacting with Fortify on Demand

[![NPM Version](https://img.shields.io/npm/v/hubot-fod.svg)](https://www.npmjs.com/package/hubot-fod)
[![Build Status](https://travis-ci.org/mtgibbs/hubot-fod.svg?branch=master)](https://travis-ci.org/mtgibbs/hubot-fod)

## Installation

Add **hubot-fod** to your hubot packages

```
npm install --save hubot-fod
```

Add **hubot-fod** to your external-scripts.json

```json
["hubot-fod"]
```

## Usage

### Commands

Here is a list of available commands shown in the hubot help menu.  

| Command                                                                    | Description                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------- |
| hubot **list apps** *(page \<n>)?*                                         | Lists applications                                |
| hubot **list** *(passing\|failing)?* **releases app \<id>** *(page \<n>)?* | Lists the releases for App \<id>                  |
| hubot **list reports app \<id>**                                           | Lists the last 3 completed reports for App \<id>  |
| hubot **list scans app \<id>**                                             | Lists the 3 most recent scans for App \<id>       |
| hubot **show issue \<id>**                                                 | Links directly to the given Issue for \<id>       |
| hubot **issues release \<id>**                                             | Gives the Issue Count breakdown for Release \<id> |

Additional verbiage is supported in some cases.  If you are interested, you can take a look at the regex for matching the command in the script.

### Examples

```
hubot list apps page 1
hubot show issue 48173817
hubot list reports app 45727
hubot issues release 183748908
hubot list passing releases for app 3212 page 2
```

## Environment Variables

Hubot requires a Fortify on Demand API Key and Secret to connect.

### HUBOT_FOD_APIKEY

This is your Fortify on Demand API Key that you can generate from your [Settings Page](https://ams.fortify.com/Admin/Settings#api).

```
export HUBOT_FOD_APIKEY="<YOUR_API_KEY_GOES_HERE>"
```

### HUBOT_FOD_APISECRET

This is your Fortify on Demand API Key Secret.

```
export HUBOT_FOD_APISECRET="<YOUR_API_SECRET_GOES_HERE>"
```

Please be careful with these values in the case where you are automating your bot deployment.  Please generate the bot its own key so that it can easily be revoked should mistakes happen.

### HUBOT_FOD_BASEURI

***OPTIONAL*** This is the URI of the instance of FoD you are interested in interacting with.  Defaults to: **ams.fortify.com**

```
export HUBOT_FOD_BASEURI="ams.fortify.com"
```

## Contributing

If you have any ideas for features that would be helpful to you, please feel free to open an issue to discuss it.

If you would like to write a feature, you can refer to the [Fortify on Demand API Swagger Page](https://api.ams.fortify.com/swagger/ui/index#/) for help with calling the API should the feature require it.

## Developer Setup

### Working on Hubot-FoD

From the project directory, run:

```
npm install
npm run typings
npm start
```

This will install all of the necessary packages, get your typings installed, and start the typescript compiler watching for changes.

If you do not want to run the compiler concurrently, run:

```
npm run tsc
```

Should your changes change the file structure and you want to start clean, run:

```
npm run clean
```

### Installing to a running Hubot Instance

If you are testing your changes with a live hubot, you can install this script from your local workspace.

Make sure to have compiled Hubot-FoD, and then from your Hubot directory:

```
npm install /path/to/hubot-fod
```

Then you can restart Hubot and he should be running your local version.  Simply run the install again when you want to test your changes.

## License

MIT License - Copyright (c) 2016 Matt Gibbs
