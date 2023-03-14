require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const { JSONRPCServer } = require("json-rpc-2.0");

const cors = require('cors')

const server = new JSONRPCServer();

server.addMethod("claim", async ({ address }) => {
    console.log(address)

    // retrieve access token
    let access_token;
    try{

        const data = {
            audience: "Sequence Wallet",
            grant_type: "client_credentials",
            client_id: process.env.client_id,
            client_secret: process.env.client_secret
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
        return false
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
                'x-api-key': process.env.api_key
            },
            body: JSON.stringify({secret_code: process.env.secret_code})
        };

        const res = await fetch(`https://api.poap.tech/event/${process.env.event_id}/qr-codes`, options)

        const response1 = await res.json()
        console.log(response1)
        if(response1.statusCode == 400) return false

        for (let i = 0; i < response1.length; i++) {
            const element = response1[i];
            if(element.claimed == false){
                console.log(element.qr_hash)
                qr_hash = element.qr_hash
                break;
            }
        }
    }catch(err){
        console.log(err)
        return false
    }

    // if qr_hash was not set, no claim links are left
    if(qr_hash == undefined) return false

    // retrieve secret
    let secret;

    try {

        options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization: `Bearer ${access_token}`,
                'x-api-key': process.env.api_key
            }
        };

        const res1 = await fetch(`https://api.poap.tech/actions/claim-qr?qr_hash=${qr_hash}`, options)
        const response2 = await res1.json()
        console.log(response2)
        if(response2.statusCode == 400) return false

        secret = response2.secret

    }catch(err){
        console.log(err)
        return false
    }

    // make claim
    try {

        options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: `Bearer ${access_token}`,
                'x-api-key': process.env.api_key
            },
            body: JSON.stringify({sendEmail: false, address: address, qr_hash: qr_hash, secret: secret})
        };
        
        const res2 = await fetch('https://api.poap.tech/actions/claim-qr', options)
        const response3 = await res2.json()
        console.log('claimed')
        console.log(response3)
        if(response3.statusCode == 400) return false

    }catch(err){
        console.log(err)
        return false
    }

    return true
});

const app = express();
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

app.listen(4000, () => {
    console.log('listening')
});