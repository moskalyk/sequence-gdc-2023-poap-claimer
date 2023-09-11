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

  const login = async () => {
    const wallet = sequence.getWallet()
  
    const connectWallet = await wallet.connect({
      app: 'Sequence GDC 2023 Webinar',
      authorize: true,
      settings: {
        theme: 'dark'
      }
    })

    if(connectWallet.connected) {
      props.setLoggedIn(true)
      collect(connectWallet.session!.accountAddress!, connectWallet.proof?.proofString!)
    }
  }

  const collect = (address: string, ethAuthProofString: string) => {
    loadingClaim = true;
    // run an rpc command to a backend where the api_secret is stored
    client
    .request("collect", { address: address, ethAuthProofString: ethAuthProofString})
    .then((result: any) => {
      // artificial delay to accommodate minting timing
      setTimeout(() => {
        props.setClaimed()
        props.setStatus(result)
        loadingClaim = false;
      }, 3000)
    })
    .catch((err: any) => {
      props.setClaimed()
      props.setStatus(4)
    })
  }

  React.useEffect(() => {
  }, [props.loadingClaim])

  return(
  <>
    {
      loadingClaim == false // not sure why this doesn't work
      ? 
        <>
          <button className="connect" onClick={() => login()}>{'Collect POAP'}</button>
        </>
      :
        <p className='loading'>Mint in progress ...</p>
    }
  </>
  )
}

let loadingClaim = false;
const App = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const [address, setAddress] = useState<string>('');
  const [ethAuthProofString, setEthAuthProofString] = useState<string | undefined>('');

  const [claimed, setClaimed] = useState<boolean>(false)
  const [status, setStatus] = useState<number>(0)

  sequence.initWallet({defaultNetwork: 'polygon'} as any)

  const openWallet = () => {
    const wallet = sequence.getWallet()
    wallet.openWallet()
  }

  return (
    <div className={'App'}>
      <img alt="bg" sizes="100vw" className="background" src="https://sequence.xyz/lander-gradient.png" decoding="async" data-nimg="fill"/>
      <br/>
      <img width="100px"src="https://poap.directory/assets/img/poap-badge.png"></img>
      <br/>
      <br/>
      <img src="https://sequence.xyz/sequence-icon.svg"/>
      &nbsp;
      <img className="center" src="https://sequence.xyz/sequence-wordmark.svg" />
      <br/>
      <br/>
      {
        loggedIn == false ? 
        <>
          <h1 className="cta">Thanks again for attending the Sequence webinar, we hope you enjoyed it!</h1>        
          <p>Claim your POAP and Common Hunter by connecting your Sequence wallet! <br/><br/> Do not have one? No worries, you'll be able to create one in just a couple clicks!</p>
        </> : null
      }
      <br/>
      {
        claimed == false
          ? 
            (
              <POAPClaim setLoggedIn={setLoggedIn} loadingClaim={loadingClaim} setStatus={setStatus} setClaimed={setClaimed} address={address} ethAuthProofString={ethAuthProofString} />
            ) 
          : 
            status == 1 
            ? 
              <><p className="confirmation"><h1 className='cta'>You've collected your POAP! <br/><br/>Your Common Hunter is on the way from BoomLand team.</h1><br/><br/>Be ready to have fun on Hunters on Chain and for additional benefits from Sequence in the coming months!</p><button className="connect" onClick={openWallet}>{'Open Wallet'}</button></>
            :
              status == 2 
              ?
                <p className='confirmation'>You've already claimed a POAP to this event<br/><br/><button className="connect" onClick={openWallet}>{'Open Wallet'}</button></p>
              :
                status == 3 
                ?
                  <p className='confirmation'>Something went wrong maybe due to too many requests. <br/>Please try again when things quiet down</p>
                :
                  status == 4 
                  ?
                    <p className='confirmation'>Seems like the POAP server is down, please try again later</p>
                  :
                    status == 5 
                    ?
                      <p className='confirmation'>There are no more POAPs available, we hope you enjoyed GDC</p>
                    :
                      <p className='confirmation'>Sequence server errors, please try again later</p>
      }
    </div>
  );
};

export default App;