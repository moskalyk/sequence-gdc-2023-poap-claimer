require('dotenv/config')
const express = require("express");
const bodyParser = require("body-parser");
const { JSONRPCServer } = require("json-rpc-2.0");
const cors = require('cors');
const bunyan = require('bunyan');
const bunyanExpress = require('express-bunyan-logger');
const { sequence } = require('0xsequence')

// Setup logging
logger = bunyan.createLogger({
    name: 'poap-server',
    serializers: bunyan.stdSerializers,
    streams: [
        {
        stream: process.stdout
        }
    ]
});

const server = new JSONRPCServer();

const config = {
    apiKey: process.env.api_key,
    clientID: process.env.client_id,
    clientSecret: process.env.client_secret,
    secretCode: process.env.secret_code,
    eventID: process.env.event_id,
    port: process.env.port | 4000
}

server.addMethod("collect", async ({ address, ethAuthProofString }) => {

    const chainId = 'polygon'
    const api = new sequence.api.SequenceAPIClient('https://api.sequence.app')
    
    const { isValid } = await api.isValidETHAuthProof({
        chainId: chainId, walletAddress: address, ethAuthProofString: ethAuthProofString
    })

    if(isValid){
        // retrieve access token
        let access_token;
        try{

            const data = {
                audience: "https://api.poap.tech",
                grant_type: "client_credentials",
                client_id: config.clientID,
                client_secret: config.clientSecret
            }

            const response = await fetch('https://poapauth.auth0.com/oauth/token', {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

            access_token = (await response.json()).access_token //
            console.log(access_token)
        }catch(err){
            return 4
        }

        // retrieve qr_hash
        let qr_hash;

        try {

            let options = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: `Bearer ${access_token}`,
                    'x-api-key': config.apiKey
                },
                body: JSON.stringify({secret_code: config.secretCode})
            };

            const res = await fetch(`https://api.poap.tech/event/${config.eventID}/qr-codes`, options)
            const response1 = await res.json()
            console.log('TESTING')
            console.log(response1)
            for (let i = 0; i < response1.length; i++) {
                const element = response1[i];

                if(element.claimed == false){
                    console.log(element.qr_hash)
                    qr_hash = element.qr_hash
                    break;
                }
            }
        }catch(err){
            return 4
        }

        // if qr_hash was not set, no claim links are left
        if(qr_hash === undefined) return 5

        // retrieve secret
        let secret;

        try {

            options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${access_token}`,
                    'x-api-key': config.apiKey
                }
            };

            const res1 = await fetch(`https://api.poap.tech/actions/claim-qr?qr_hash=${qr_hash}`, options)
            const response2 = await res1.json()

            secret = response2.secret

        }catch(err){
            console.log(err)
            return 4
        }

        // make claim
        try {

            options = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: `Bearer ${access_token}`,
                    'x-api-key': config.apiKey
                },
                body: JSON.stringify({sendEmail: false, address: address, qr_hash: qr_hash, secret: secret})
            };

            const res2 = await fetch('https://api.poap.tech/actions/claim-qr', options)
            const response3 = await res2.json()

            if(response3.message == 'QR Claim already claimed') {
                return 3
            } else if(response3.message == 'Collector already claimed a code for this Event'){
                return 2
            }

        }catch(err){
            console.log(err)
            return 4
        }
        return 1
    } else {
        return 6
    }
});

const app = express();
app.use(bunyanExpress({
    name: 'poap-server',
    serializers: bunyan.stdSerializers,
    streams: [
      {
        stream: process.stdout
      }
    ]
}))

app.use(bodyParser.json());
app.use(cors())

app.post("/json-rpc", (req, res) => {
  const jsonRPCRequest = req.body;
  server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
    if (jsonRPCResponse) {
      res.json(jsonRPCResponse);
    } else {
      res.sendStatus(204);
    }
  });
});

app.get("/", (req, res) => {
    res.sendStatus(200);
});

const expressServer = app.listen(config.port, () => {
    logger.info(`Listening on port ${config.port}`)

    if (config.apiKey == undefined || config.apiKey == '') {
        logger.warn("api key not set")
    }
    if (config.clientID == undefined || config.clientID == '') {
        logger.warn("client id not set")
    }
    if (config.clientSecret == undefined || config.clientSecret == '') {
        logger.warn("client secret not set")
    }
    if (config.eventID == undefined || config.eventID == '') {
        logger.warn("event id not set")
    }
    if (config.secretCode == undefined || config.secretCode == '') {
        logger.warn("secret code not set")
    }
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server')
    expressServer.close(() => {
        logger.info('HTTP server closed')
    })
})

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server')
    expressServer.close(() => {
        logger.info('HTTP server closed')
    })
})