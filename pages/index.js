import { useState } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';

export default function Home() {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('');
  const [step, setStep] = useState('home'); // 'home', 'upload', 'payment'

  // Form Alanları
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('2');

  const PLATFORM_WALLET = "0xAd58d1050942F795E651153231Ce8A152180C055";

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setStatus('Cüzdan bağlandı!');
      } catch (error) {
        console.error(error);
        setStatus('Bağlantı reddedildi.');
      }
    } else {
      alert("Lütfen MetaMask yükleyin!");
    }
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!file || !title || !price) {
      alert("Lütfen görsel/video, eser adı ve fiyat alanlarını doldurun!");
      return;
    }
    if (!account) {
      alert("Lütfen önce cüzdanınızı bağlayın!");
      connectWallet();
      return;
    }
    setStep('payment');
  };

  const payListingFee = async () => {
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

      setStatus('Ödeme gönderiliyor, onay bekleniyor...');
      await tx.wait();
      setStatus('Tebrikler! Eseriniz başarıyla yüklendi ve ilanınız aktifleştirildi.');
      setStep('home');
    } catch (error) {
      console.error(error);
      setStatus('İşlem iptal edildi veya hata oluştu.');
    }
  };

  const selectedMonthText = (plan) => {
    if (plan === '2') return '2 Aylık (300 TL karşılığı ETH)';
    if (plan === '4') return '4 Aylık (600 TL karşılığı ETH)';
    return '6 Aylık (900 TL karşılığı ETH)';
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <Head>
        <title>ArtBazaar - Sanatını Keşfet ve Sat</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f6851b" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Üst Kısım / Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#111' }}>ArtBazaar</h2>
        {!account ? (
          <button onClick={connectWallet} style={{ backgroundColor: '#f6851b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Cüzdan Bağla
          </button>
        ) : (
          <span style={{ fontSize: '14px', color: 'green', fontWeight: 'bold' }}>
            {account.substring(0, 4)}...{account.substring(38)}
          </span>
        )}
      </div>

      {/* 1. ADIM: ANA SAYFA */}
      {step === 'home' && (
        <div>
          <h1 style={{ fontSize: '28px', color: '#222' }}>Sanatı Keşfet, Eserini Satışa Sun, Koleksiyonunu Oluştur.</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>ArtBazaar, sanatçıları ve sanatseverleri güvenli bir dijital pazaryerinde bir araya getirir.</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                if(!account) { connectWallet(); }
                setStep('upload');
              }}
              style={{ backgroundColor: '#111', color: 'white', border: 'none', padding: '14px 28px', fontSize: '16px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Eserini Yükle
            </button>
          </div>
        </div>
      )}

      {/* 2. ADIM: ESER BİLGİLERİ VE DOSYA YÜKLEME */}
      {step === 'upload' && (
        <div style={{ background: '#fafafa', padding: '25px', borderRadius: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
          <h3>Eser Detaylarını Girin</h3>
          <form onSubmit={handleProceedToPayment}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Görsel veya Video Seçin:</label>
              <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Eser Adı:</label>
              <input type="text" placeholder="Örn: Soyut Gece" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Açıklama:</label>
              <textarea placeholder="Eser hakkında kısa bilgi..." value={description} onChange={(e) => setDescription(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Satış Fiyatı (TL):</label>
              <input type="number" placeholder="Örn: 5000" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep('home')} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Geri</button>
              <button type="submit" style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Ödeme Adımına Geç</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. ADIM: İLAN ÜCRETİ ÖDEME SAYFASI */}
      {step === 'payment' && (
        <div style={{ background: '#f9f9f9', padding: '25px', borderRadius: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
          <h3>İlan Yayınlama Ücreti</h3>
          <p style={{ fontSize: '14px', color: '#555' }}>Eseriniz: <strong>{title}</strong> ({price} TL)</p>
          <p style={{ fontSize: '14px', color: '#555' }}>Lütfen sergileme sürenizi seçin:</p>

          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ cursor: 'pointer' }}>
              <input type="radio" name="plan" value="2" checked={selectedPlan === '2'} onChange={(e) => setSelectedPlan(e.target.value)} /> 2 Aylık İlan (0.001 ETH)
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input type="radio" name="plan" value="4" checked={selectedPlan === '4'} onChange={(e) => setSelectedPlan(e.target.value)} /> 4 Aylık İlan (0.002 ETH)
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input type="radio" name="plan" value="6" checked={selectedPlan === '6'} onChange={(e) => setSelectedPlan(e.target.value)} /> 6 Aylık İlan (0.003 ETH)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep('upload')} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Geri</button>
            <button onClick={payListingFee} style={{ padding: '12px 24px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Ödemeyi Tamamla ve Yayınla
            </button>
          </div>
        </div>
      )}

      {status && <p style={{ marginTop: '20px', fontWeight: 'bold', color: '#333' }}>{status}</p>}
    </div>
  );
}
