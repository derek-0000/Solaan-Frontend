import React, { useEffect, useState } from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import kp from "./keypair.json";

import { Buffer, constants } from "buffer";
window.Buffer = Buffer;

import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";

// // Constants
const TWITTER_HANDLE = "derek0000_";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const { SystemProgram, Keypair } = web3;

// let baseAccount = Keypair.generate();
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey("G5AEKXqvkk7VumHSkGu8VKjiArx9ikC21j6irhoetFE3");
const network = clusterApiUrl("devnet");
console.log(network);

const opts = {
  preflightCommitment: "processed",
};

//App
const App = () => {
  const transactionButton = (artist) => (
    <button
      className="cta-button submit-gif-button"
      onClick={() => signInTransactionAndSendMoney()}
    ></button>
  );

  const lamports_per_sol = LAMPORTS_PER_SOL;
 
  function signInTransactionAndSendMoney(destPubkeyStr, lamports) {
    (async () => {
      const connection = new Connection(network);
      const transaction = new Transaction();
      lamports = 2* lamports_per_sol;
      try {
        destPubkeyStr = "AzZqNiXbaWkA3xbDXHdJ2NBt4JHE9pnRNybBdv8WvSMX";
        lamports = 2 * lamports_per_sol;
        console.log("starting sendMoney");
        const destPubkey = new PublicKey(destPubkeyStr);
        const walletAccountInfo = await connection.getAccountInfo(
          user.publicKey
        );
        console.log("wallet data size", walletAccountInfo?.data.length);
        const receiverAccountInfo = await connection.getAccountInfo(destPubkey);
        console.log("receiver data size", receiverAccountInfo?.data.length);
        const instruction = SystemProgram.transfer({
          fromPubkey: user.publicKey,
          toPubkey: destPubkey,
          lamports,
        });
        let trans = await setWalletTransaction(instruction, connection);
        let signature = await signAndSendTransaction(user, trans, connection);
        let result = await connection.confirmTransaction(
          signature,
          "singleGossip"
        );
        console.log("money sent", result);
      } catch (e) {
        console.warn("Failed", e);
      }
    })();
    async function setWalletTransaction(instruction, connection) {
      const transaction = new Transaction();
      transaction.add(instruction);
      transaction.feePayer = user.publicKey;
      let hash = await connection.getRecentBlockhash();
      console.log("blockhash", hash);
      transaction.recentBlockhash = hash.blockhash;
      return transaction;
    }
    async function signAndSendTransaction(user, transaction, connection) {
      // Sign transaction, broadcast, and confirm
      const { signature } = await window.solana.signAndSendTransaction(
        transaction
      );
      await connection.confirmTransaction(signature);
      //let signedTrans = await wallet.signTransaction(transaction);
      console.log("sign transaction");
      //let signature = await connection.sendRawTransaction(signedTrans.serialize());
      console.log("send raw transaction");
      return signature;
    }
  }

  const [walletAddress, setWalletAddress] = useState(null); //Usuario Logeado
  const [inputValue, setInputValue] = useState(""); // El valor del input para gifs
  const [gifList, setGifList] = useState([]); // Lista de gifs con usuario que publico
  const [artistView, setAtisitView] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [user, setUser] = useState(null);
  const [userKeypair, setUserKeypair] = useState(null);

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };
  // Wallet logic
  const checkIfConnected = async () => {
    if (window?.solana?.isPhantom) {
      console.log("Phantom wallet found!");
      const response = await window.solana.connect({ onlyIfTrusted: true });
      console.log("Connected with Public Key: ", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    } else {
      alert("Solana object not found! Get a Phantom Wallet 👻");
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      const userKeyPair = Keypair.generate();
      setUserKeypair(userKeyPair);
      setWalletAddress(response.publicKey.toString());
      setPublicKey(response.publicKey);
      setUser(response);
    }
  };
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!");
      return;
    }
    setInputValue("");
    console.log("Gif Link:", inputValue);
    try {
      const provider = getProvider();
      const program = await getProgram();
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue);
      await getGifList();
    } catch (error) {
      console.log("Error Sending Gif:", error);
    }
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();

      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const getProgram = async () => {
    const idl = await Program.fetchIdl(programID, getProvider());
    return new Program(idl, programID, getProvider());
  };

  const getGifList = async () => {
    try {
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );
      console.log("Got the account", account);
      setGifList(account.gifList);
      console.log(gifList);
    } catch (error) {
      console.log("Error in getGifList: ", error);
      setGifList(null);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={() => connectWallet()}
    >
      Connect Wallet
    </button>
  );

  const renderArtist = (artist) => (
    <div className="c-artist">
      <img src={artist.gifLink} />
      <div className="artist-name">{`${artist.userAddress.toString()}`}</div>
      <div className="c-buttons">
        <button
          className="cta-button connect-wallet-button"
          onClick={() => setAtisitView(null)}
        >
          X
        </button>
        <button
          className="cta-button connect-wallet-button"
          onClick={() => handeTransaction()}
        >
          Tip
        </button>
      </div>
    </div>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Post
            </button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div key={index}>
                <div className="gif-item">
                  <img src={item.gifLink} onClick={() => setAtisitView(item)} />
                  Artist: {`${item.userAddress.toString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      {transactionButton()}
      <div className="container">
        <div className="header-container">
          <p className="header">Block-Reader</p>
          <p className="sub-text">
            A space for you to read, post and receive✨
          </p>
          {artistView != null && renderArtist(artistView)}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <a className="footer-text">
            Built By: Derek Alvarado, Salvador Perez, Joshua Aviles & Miguel
            Velarde
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
