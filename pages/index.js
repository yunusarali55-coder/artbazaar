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

  const PLATFORM_WALLET = "0xAd58d105942F795E651153231Ce8A152180C055";

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
      alert('Lütfen MetaMask yükleyin!');
    }
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!file || !title || !price) {
      alert('Lütfen görsel/video, eser adı ve fiyat alanlarını doldurun!');
      return;
    }
    if (!account) {
      alert('Lütfen önce cüzdanınızı bağlayın!');
      connectWallet();
      return;
    }
    setStep('payment');
  };

  const payListingFee = async () => {
    let ethAmount = '0.001';
    if (selectedPlan === '4') ethAmount = '0.002';
    if (selectedPlan === '6') ethAmount = '0.003';

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

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <Head>
        <title>ArtBazaar - Sanatını Keşfet ve Sat</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f6051b" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Üst Kısım / Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#111' }}>ArtBazaar</h2>
        {!account ? (
          <button onClick={connectWallet} style={{ backgroundColor: '#f6051b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Cüzdan Bağla
          </button>
        ) : (
          <span style={{ fontSize: '14px', color: 'green', fontWeight: 'bold' }}>
            {account.substring(0, 6)}...{account.substring(38)}
          </span>
        )}
      </div>

      {/* Ana Sayfa */}
      {step === 'home' && (
        <div>
          <h1 style={{ fontSize: '28px', color: '#111', marginBottom: '10px' }}>Sanatı Keşfet, Eserini Satışa Sun</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Güvenli ve merkeziyetsiz dijital pazaryerinde koleksiyonunu oluştur.</p>
          <button onClick={() => setStep('upload')} style={{ backgroundColor: '#111', color: 'white', border: 'none', padding: '15px 30px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Eserini Yükle
          </button>
        </div>
      )}

      {/* Yükleme Formu */}
      {step === 'upload' && (
        <form onSubmit={handleProceedToPayment} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Yeni Eser Yükle</h3>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Görsel veya Video Seç</label>
            <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Eser Adı</label>
            <input type="text" placeholder="Örn: Dijital Portre" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Açıklama</label>
            <textarea placeholder="Eseriniz hakkında kısa bilgi verin..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', height: '80px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fiyat (ETH)</label>
            <input type="text" placeholder="0.05" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setStep('home')} style={{ flex: 1, padding: '12px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>İptal</button>
            <button type="submit" style={{ flex: 1, padding: '12px', background: '#f6051b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Devam Et</button>
          </div>
        </form>
      )}

      {/* Ödeme Adımı */}
      {step === 'payment' && (
        <div style={{ textAlign: 'left', background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>İlan Süresi ve Ücreti Seçin</h3>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>Eserinizi platformda aktif tutmak için bir süre seçiniz:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <label style={{ cursor: 'pointer', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <input type="radio" name="plan" value="2" checked={selectedPlan === '2'} onChange={(e) => setSelectedPlan(e.target.value)} /> 2 Aylık (300 TL karşılığı ETH - 0.001 ETH)
            </label>
            <label style={{ cursor: 'pointer', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <input type="radio" name="plan" value="4" checked={selectedPlan === '4'} onChange={(e) => setSelectedPlan(e.target.value)} /> 4 Aylık (600 TL karşılığı ETH - 0.002 ETH)
            </label>
            <label style={{ cursor: 'pointer', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <input type="radio" name="plan" value="6" checked={selectedPlan === '6'} onChange={(e) => setSelectedPlan(e.target.value)} /> 6 Aylık (900 TL karşılığı ETH - 0.003 ETH)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button onClick={() => setStep('upload')} style={{ padding: '12px 20px', background: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Geri</button>
            <button onClick={payListingFee} style={{ padding: '12px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Ödemeyi Tamamla ve Yayınla
            </button>
          </div>
        </div>
      )}

      {status && <p style={{ marginTop: '20px', fontWeight: 'bold', color: '#333' }}>{status}</p>}
    </div>
  );
}
