import React from "react";
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

function ConnectedContainer(props) {
  const gifList = props.gifList
  return (
    <React.Fragment>
      if (gifList === null)
      {
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={() => createGifAccount()}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      }
      else
      {
        <div className="connected-container">
          <form
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
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div key={index}>
                <div className="gif-item">
                  <img src={item.gifLink} onClick={() => setArtistView(item)} />
                  Artist: {`${item.userAddress.toString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    </React.Fragment>
  );
}

export default ConnectedContainer;
