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
import "./App.css";
const { SystemProgram, Keypair } = web3;
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey("G5AEKXqvkk7VumHSkGu8VKjiArx9ikC21j6irhoetFE3");
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};
import ConnectedContainer from "./Components/ConnectedContainer";
//App
const App = () => {
  const [walletAddress, setWalletAddress] = useState(null); //Usuario Logeado
  const [inputValue, setInputValue] = useState(""); // El valor del input para gifs
  const [tipValue, setTipValue] = useState(""); // El valor del input para gifs
  const [gifList, setGifList] = useState([]); // Lista de gifs con usuario que publico
  const [artistView, setArtistView] = useState(null);
  const [user, setUser] = useState(null);

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

  //Conditional Copmponents
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            signInTransactionAndSendMoney(
              artist.userAddress.toString(),
              tipValue
            );
          }}
        >
          <input
            type="number"
            placeholder="$$"
            value={tipValue}
            onChange={onTipChange}
          />
          <button type="submit" className="cta-button tip">
            Tip
          </button>
          <button
            className="cta-button clear-button"
            onClick={() => setArtistView(null)}
          >
            X
          </button>
        </form>
      </div>
    </div>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={() => createGifAccount()}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    } else {
      return (
        <div className="connected-container">
          <form
            className="upload"
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Publish Your Art!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Post
            </button>
          </form>
          <div className="c-gif-grid">
            <div className="gif-grid">
              {gifList.map((item, index) => (
                <div className="gif-item" key={index}>
                  <img src={item.gifLink} onClick={() => setArtistView(item)} />
                  User: {`${item.userAddress.toString()}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  function signInTransactionAndSendMoney(remitent, tip) {
    setTipValue(0);
    const lamports_per_sol = LAMPORTS_PER_SOL;
    (async () => {
      const connection = new Connection(network);
      const transaction = new Transaction();
      const lamports = tip * lamports_per_sol;
      try {
        console.log("starting sendMoney");
        const destPubkey = new PublicKey(remitent);
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
      const { signature } = await window.solana.signAndSendTransaction(
        transaction
      );
      await connection.confirmTransaction(signature);
      console.log("sign transaction");
      console.log("send raw transaction");
      return signature;
    }
  }
  // Blockchain Logic
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };
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
      setWalletAddress(response.publicKey.toString());
      setUser(response);
    }
  };
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };
  const onTipChange = (event) => {
    const { value } = event.target;
    setTipValue(value);
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

  const contentHeader = () => (
    <div className="c-header">
      <div className="c-header-image">
        <img
          className="header-image"
          src="src/assets/ikuro_logo.png"
          alt="ikuro"
        />
      </div>
    </div>
  );

  const heroHeader = () => (
    <header className={walletAddress ? "content-header" : "hero-header"}>
      <div className={walletAddress ? "header-container" : "hero-container"}>
        <h1 className="header-title">Ikuro 郁郎</h1>
        <p className="header-text">
          A space for you to share, inspire and recieve✨
        </p>
        {!walletAddress && renderNotConnectedContainer()}
      </div>
    </header>
  );

  return (
    <div className="App">
      {!walletAddress && heroHeader()}
      {walletAddress && contentHeader()}
      <div className="c-content">
        {artistView != null && renderArtist(artistView)}
        {walletAddress && renderConnectedContainer()}
      </div>
      <footer>
        <p>Project Developed during the Etherfuse Hackaton 2023 </p>
        <p>
          Built By: Derek Alvarado, Salvador Perez, Joshua Aviles & Miguel
          Velarde
        </p>
      </footer>
    </div>
  );
};

export default App;
