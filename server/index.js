require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const { JSONRPCServer } = require("json-rpc-2.0");

const cors = require('cors')

const server = new JSONRPCServer();

server.addMethod("claim", async ({ address }) => {
    console.log(address)

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

    const access_token = (await response.json()).access_token //
    console.log(access_token)

    const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${access_token}`,
          'x-api-key': process.env.api_key
        },
        body: JSON.stringify({secret_code: process.env.secret_code})
      };
      
      fetch(`https://api.poap.tech/event/${process.env.event_id}/qr-codes`, options)
        .then(response => response.json())
        .then(response => {
            console.log(response)
            for (let i = 0; i < response.length; i++) {
                const element = response[i];
                if(element.claimed == false){
                    console.log(element.qr_hash)

                    const options = {
                        method: 'GET',
                        headers: {
                          accept: 'application/json',
                          authorization: `Bearer ${access_token}`,
                          'x-api-key': process.env.api_key
                        }
                      };
                      
                      fetch(`https://api.poap.tech/actions/claim-qr?qr_hash=${element.qr_hash}`, options)
                        .then(response => response.json())
                        .then(response => {
                            console.log(response)
                            const secret = response.secret
                            const options = {
                                method: 'POST',
                                headers: {
                                  accept: 'application/json',
                                  'content-type': 'application/json',
                                  authorization: `Bearer ${access_token}`,
                                  'x-api-key': process.env.api_key
                                },
                                body: JSON.stringify({sendEmail: false, address: address, qr_hash: element.qr_hash, secret: secret})
                              };
                              
                              fetch('https://api.poap.tech/actions/claim-qr', options)
                                .then(response => response.json())
                                .then(response => {
                                    console.log('claimed')
                                    console.log(response)
                                })
                                .catch(err => console.error(err));
                        })
                        .catch(err => console.error(err));
                    break;
                }
            }
        })
        .catch(err => console.error(err));
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