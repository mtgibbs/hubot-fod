# hubot-fod
Hubot Script for interacting with Fortify on Demand (Prototype)

## Installation

Add **hubot-fod** to your hubot packages

```
npm install --save hubot-fod
```

Add **hubot-fod** to your external-scripts.json

```json
["hubot-fod"]
```

## Environment Variables

Hubot requires a Fortify on Demand API Key and Secret to connect.

### HUBOT_FOD_APIKEY

This is your HPE Fortify on Demand API Key that you can generate from your [Settings Page](https://hpfod.com/Admin/Settings#api).

```
export HUBOT_FOD_APIKEY="<YOUR_API_KEY_GOES_HERE>"
```

### HUBOT_FOD_APISECRET

This is your HPE Fortify on Demand API Key Secret.

```
export HUBOT_FOD_APISECRET="<YOUR_API_SECRET_GOES_HERE>"
```

Please be careful with these values in the case where you are automating your bot deployment.  Please generate the bot its own key so that it can easily be revoked should mistakes happen.

### HUBOT_FOD_BASEURI

***OPTIONAL*** This is the URI of the instance of FoD you are interested in interacting with.  Defaults to: **hpfod.com**

```
export HUBOT_FOD_BASEURI="hpfod.com"
```

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
