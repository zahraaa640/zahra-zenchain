import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import Chart from 'chart.js/auto';
import './App.css';
import abiJson from './abi.json';
import logo from './assets/zenchain-logo.png';

// آدرس و ABI از ساختار جدید abi.json
const contractAddress = abiJson.address;
const contractABI = abiJson.abi;

function App() {
  const [account, setAccount] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [nftUrl, setNftUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const chartRef = useRef(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 8408) {
        alert('Please switch MetaMask to ZenChain Testnet before using the DApp');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(`Wallet connection error: ${err.message}`);
    }
  };

  const loadArtworks = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const count = await contract.getArtworkCount();
      const items = [];
      for (let i = 0; i < count; i++) {
        const art = await contract.artworks(i);
        items.push({
          id: i,
          title: art.title,
          artist: art.artist,
          nftUrl: art.nftUrl,
          likes: art.likes.toNumber()
        });
      }
      setArtworks(items);
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error loading artworks: ${err.message}`);
    }
  };

  const registerArtwork = async (e) => {
    e.preventDefault();

    // اگر والت وصل نیست
    if (!account) {
      setStatusMessage('Please connect your wallet first');
      return;
    }

    if (!title || !artist || !nftUrl) {
      setStatusMessage('Please fill in all fields');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 8408) {
        setStatusMessage(`Wrong network: connected to ChainID ${network.chainId}, switch to ZenChain Testnet (8408)`);
        return;
      }

      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const fee = await contract.registrationFee();
      setStatusMessage(`Registration fee: ${ethers.utils.formatEther(fee)} ZTC`);

      await contract.callStatic.registerArtwork(title, artist, nftUrl, { value: fee });
      const tx = await contract.registerArtwork(title, artist, nftUrl, { value: fee });
      await tx.wait();

      setStatusMessage('Artwork registered successfully');
      setTitle('');
      setArtist('');
      setNftUrl('');
      loadArtworks();
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error registering artwork: ${err.message}`);
    }
  };

  const likeArtwork = async (id) => {
    // اگر والت وصل نیست
    if (!account) {
      setStatusMessage('Please connect your wallet first');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 8408) {
        setStatusMessage(`Wrong network: connected to ChainID ${network.chainId}, switch to ZenChain Testnet (8408)`);
        return;
      }

      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const fee = await contract.likeFee();
      await contract.callStatic.likeArtwork(id, { value: fee });
      const tx = await contract.likeArtwork(id, { value: fee });
      await tx.wait();
      setStatusMessage('Artwork liked successfully');
      loadArtworks();
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error liking artwork: ${err.message}`);
    }
  };

  const renderLikesChart = () => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const ctx = document.getElementById('likesChart').getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: artworks.map(a => a.title),
        datasets: [{
          label: 'Likes',
          data: artworks.map(a => a.likes),
          backgroundColor: '#00e676'
        }]
      },
      options: {
        scales: {
          x: { ticks: { color: '#a6ff00' }, grid: { color: '#333' } },
          y: { ticks: { color: '#a6ff00' }, grid: { color: '#333' } }
        }
      }
    });
  };

  useEffect(() => {
    loadArtworks();
  }, []);

  useEffect(() => {
    if (artworks.length > 0) {
      renderLikesChart();
    }
  }, [artworks]);

  return (
    <div className="container">
      <header>
        <div className="header-left">
          <img src={logo} alt="ZenChain Logo" className="zenchain-logo" />
          <h1>ZenChain Art DApp</h1>
        </div>
        {account ? (
          <div className="wallet-address">
            {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </div>
        ) : (
          <button className="connect-wallet-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </header>

      <section className="registration">
        <h2>Register Artwork</h2>
        <form onSubmit={registerArtwork}>
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="text" placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
          <input type="text" placeholder="NFT URL" value={nftUrl} onChange={(e) => setNftUrl(e.target.value)} />
          <button type="submit">Register</button>
        </form>
        {statusMessage && (
          <p className={statusMessage.includes('Error') ? 'error' : 'success'}>{statusMessage}</p>
        )}
      </section>

      <section>
        <h2>Artworks</h2>
        <div className="artworks">
          {artworks.map(art => (
            <div key={art.id} className="art-card">
              <h3>{art.title}</h3>
              <p>Artist: {art.artist}</p>
              <p>
                <a href={art.nftUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0ff" }}>
                  NFT LINK
                </a>
              </p>
              {art.nftUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) || art.nftUrl.startsWith('ipfs://') ? (
                <img
                  src={art.nftUrl.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${art.nftUrl.replace('ipfs://', '')}` : art.nftUrl}
                  alt={art.title}
                />
              ) : null}
              <p>Likes: {art.likes}</p>
              <button onClick={() => likeArtwork(art.id)}>❤️ Like</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Likes Statistics</h2>
        <canvas id="likesChart" width="400" height="200"></canvas>
      </section>
    </div>
  );
}

export default App;
