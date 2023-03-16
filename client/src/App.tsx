import React, {useState} from 'react';
import { JSONRPCClient } from "json-rpc-2.0";
import { sequence } from '0xsequence'
import './App.css';

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

const POAPClaim: any = (props: any) => {

  const [loadingClaim, setLoadingClaim] = useState<any>(false)

  const claim = () => {
    // setTimeout(() => setLoadingClaim(true), 0)
    console.log(props.address)
    setLoadingClaim(true)
    // run an rpc command to a backend where the api_secret is stored
    client
    .request("claim", { address: props.address})
    .then((result: any) => {
      // props.wallet.openWallet()
      props.setClaimed()
      props.setStatus(result)
      setLoadingClaim(false)
    })
    .catch((err: any) => {
      props.setClaimed()
      props.setStatus(3)
    })
  }

  return(
  <>
    {
      loadingClaim == false // not sure why this doesn't work
      ? 
        <>
          <button className="connect" onClick={claim}>{'claim POAP'}</button>
        </>
      :
        <p className='loading'>claim in progress ...</p>
    }
  </>
  )
}

const App = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [walletProp, setWalletProp] = useState<any>(null);
  const [claimed, setClaimed] = useState<boolean>(false)
  const [status, setStatus] = useState<number>(0)

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
    <div className={'App'}>
      <br/>
      <img alt="bg" sizes="100vw" className="background" src="https://sequence.xyz/_next/image?url=%2Flander-gradient.png&w=2048&q=100" decoding="async" data-nimg="fill"/>
      <br/>
      <br/>
      <img width="100px"src="https://poap.directory/assets/img/poap-badge.png"></img>
      <br/>
      <br/>
      <img src="https://sequence.xyz/sequence-icon.svg"/>
      &nbsp;
      <img className="center" src="https://sequence.xyz/sequence-wordmark.svg" />
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      {
        claimed == false ? <h1 className='cta'>claim your GDC 2023 POAP</h1> : null
      }
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      {
        ! loggedIn 
        ? 
          (
            <button className="connect" onClick={login}>{'connect'}</button>
          ) 
        : 
          claimed == false 
          ? 
            (
              <POAPClaim setStatus={setStatus} setClaimed={setClaimed} address={address} wallet={walletProp}/>
            ) 
          : 
            status == 1 
            ? 
              <p className='confirmation'>Thank you for coming by our booth! <br/><br/>We will follow up with a timely SkyWeaver Silvercard airdrop!</p>
            :
              status == 2 
              ?
                <p className='confirmation'>You've already claimed a POAP to this event</p>
              :
                status == 3 
                ?
                  <p className='confirmation'>Something went wrong maybe due to too many requests, <br/>please try again when things quiet down</p>
                :
                  status == 4 
                  ?
                    <p className='confirmation'>Seems like the POAP server is down, please try again later</p>
                  :
                    <p className='confirmation'>There are no more POAPs available, we hope you enjoyed GDC</p>
      }
    </div>
  );
};

export default App;