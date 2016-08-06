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
