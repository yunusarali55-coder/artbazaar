
import { useState } from 'react';
import { ethers } from 'ethers';

export default function Home() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('2');

  const PLATFORM_WALLET = "0xAd58d1050942F795E651153231Ce8A152180C055";

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const bal = await provider.getBalance(accounts[0]);
        setBalance(ethers.utils.formatEther(bal));
        setStatus('Cüzdan bağlandı!');
      } catch (error) {
        console.error(error);
        setStatus('Bağlantı reddedildi.');
      }
    } else {
      alert("Lütfen MetaMask yükleyin!");
    }
  };

  const payListingFee = async () => {
    if (!account) {
      alert("Önce cüzdanınızı bağlayın!");
      return;
    }

    let ethAmount = "0.001"; 
    if (selectedPlan === '4') ethAmount = "0.002"; 
    if (selectedPlan === '6') ethAmount = "0.003"; 

    try {
      setStatus('İlan ücreti ödeniyor...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: PLATFORM_WALLET,
        value: ethers.utils.parseEther(ethAmount)
      });

      setStatus('İlan ücreti gönderiliyor, onay bekleniyor...');
      await tx.wait();
      setStatus(`${selectedMonthText(selectedPlan)} ilanınız başarıyla aktifleştirildi!`);
    } catch (error) {
      console.error(error);
      setStatus('İşlem iptal edildi.');
    }
  };

  const selectedMonthText = (plan) => {
    if (plan === '2') return '2 Aylık (300 TL)';
    if (plan === '4') return '4 Aylık (600 TL)';
    return '6 Aylık (900 TL)';
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>ArtBazaar Sanatçı Paneli</h1>
      <p>İlan sürenizi seçin, %90 kazanç ve %10 komisyon sistemiyle hemen satışa başlayın.</p>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          style={{ backgroundColor: '#f6851b', color: 'white', border: 'none', padding: '12px 24px', fontSize: '16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          MetaMask ile Giriş Yap
        </button>
      ) : (
        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
          <p style={{ color: 'green', fontWeight: 'bold' }}>Bağlı Cüzdan: {account.substring(0, 6)}...{account.substring(38)}</p>
          
          <h3 style={{ marginTop: '20px' }}>İlan Süresi Seçin</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '15px', cursor: 'pointer' }}>
              <input type="radio" name="plan" value="2" checked={selectedPlan === '2'} onChange={(e) => setSelectedPlan(e.target.value)} /> 2 Ay (300 TL)
            </label>
            <label style={{ marginRight: '15px', cursor: 'pointer' }}>
              <input type="radio" name="plan" value="4" checked={selectedPlan === '4'} onChange={(e) => setSelectedPlan(e.target.value)} /> 4 Ay (600 TL)
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input type="radio" name="plan" value="6" checked={selectedPlan === '6'} onChange={(e) => setSelectedPlan(e.target.value)} /> 6 Ay (900 TL)
            </label>
          </div>

          <button 
            onClick={payListingFee}
            style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '12px 24px', fontSize: '16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            İlan Ver ve Ödeme Yap ({selectedMonthText(selectedPlan)})
          </button>
        </div>
      )}

      {status && <p style={{ marginTop: '20px', fontWeight: 'bold', color: '#333' }}>{status}</p>}
    </div>
  );
                     }
