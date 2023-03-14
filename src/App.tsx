import type { Component } from 'solid-js';

import { createSignal } from "solid-js";

import logo from './logo.svg';
import styles from './App.module.css';

import { sequence } from '0xsequence'

import { JSONRPCClient } from "json-rpc-2.0";

// create a client
const client: any = new JSONRPCClient((jsonRPCRequest: any) =>
  fetch("http://localhost:4000/json-rpc", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(jsonRPCRequest),
  }).then((response) => {
    if (response.status === 200) {
      // Use client.receive when you received a JSON-RPC response.
      return response
        .json()
        .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
    } else if (jsonRPCRequest.id !== undefined) {
      return Promise.reject(new Error(response.statusText));
    }
  })
);

const POAPClaim = (props: any) => {

  const claim = () => {
    console.log(props.address)
    // run an rpc command to a backend where the api_secret is stored
    client
    .request("claim", { address: props.address})
    .then((result: any) => {
      console.log(result)
      props.wallet.openWallet()
      props.setClaimed()
      props.setSuccess(result)
    })
  }

  return(
  <>
    <button class="connect" onClick={claim}>{'claim POAP'}</button>
  </>
  )
}

const App: Component = () => {
  const [loggedIn, setLoggedIn] = createSignal<boolean>(false);
  const [address, setAddress] = createSignal<string>('');
  const [walletProp, setWalletProp] = createSignal<any>(null);
  const [claimed, setClaimed] = createSignal<boolean>(false)
  const [success, setSuccess] = createSignal<boolean>(false)

  const wallet = sequence.initWallet('polyon')

  const login = async () => {
    const wallet = sequence.getWallet()
    setWalletProp(wallet)
  
    const connectWallet = await wallet.connect({
      networkId: 137,
      app: 'Sequence GDC 2023 Claimer',
      authorize: true,
      settings: {
        theme: 'dark'
      }
    })

    if(connectWallet.connected) setLoggedIn(true)
    setAddress(connectWallet.session!.accountAddress!)
  }

  return (
    <div class={styles.App}>
      <br/>
      <img alt="bg" sizes="100vw" class="background" srcset="https://sequence.xyz/_next/image?url=%2Flander-gradient.png&w=2048&q=100" decoding="async" data-nimg="fill" style="position:absolute;top:0;left:0;bottom:0;right:0;box-sizing:border-box;padding:0;border:none;margin:auto;display:block;width:0;height:0;min-width:100%;max-width:100%;min-height:100%;max-height:100%"></img>
      <br/>
      <br/>
      <img width="100px"src="https://poap.directory/assets/img/poap-badge.png"></img>
      <br/>
      <br/>
      <img src="https://sequence.xyz/sequence-icon.svg"/>
      &nbsp;
      <img class="center" src="https://sequence.xyz/sequence-wordmark.svg" />
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      {
        claimed() == false ? <h1 class='cta'>claim your GDC 2023 POAP</h1> : null
      }
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      {
        ! loggedIn() 
        ? 
          (
            <button class="connect" onClick={login}>{'connect'}</button>
          )
        : 
          claimed() == false 
          ? 
            (
              <POAPClaim setSuccess={setSuccess} setClaimed={setClaimed} address={address()} wallet={walletProp()}/>
            ) 
          : 
            success() == true 
          ? 
            <p class='confirmation'>Thank you for coming by our booth! <br/><br/>We will follow up with a timely SkyWeaver Silvercard airdrop!</p>
          :
          <p class='confirmation'>Something went wrong maybe due to too many requests, please try again when things quiet down</p>
              
      }
    </div>
  );
};

export default App;
