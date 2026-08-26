import { useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';

export default function Home() {
  const [account, setAccount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('1'); // Ay cinsinden
  const [price, setPrice] = useState('0.004'); // Örnek fiyat
  const [imageFile, setImageFile] = useState(null);

  // Cüzdan Bağlama Fonksiyonu
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Cüzdan bağlantı hatası:', error);
      }
    } else {
      alert('Lütfen MetaMask veya uyumlu bir Web3 cüzdanı yükleyin!');
    }
  };

  // Eser Listeleme ve Ödeme Süreci
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      alert('Lütfen önce cüzdanınızı bağlayın!');
      return;
    }
    alert(`Eser başarıyla sisteme yüklendi! Seçilen süre: ${duration} Ay. Ödeme onayı bekleniyor...`);
  };

  // Süre değiştikçe örnek fiyatı otomatik güncelleme
  const handleDurationChange = (e) => {
    const val = e.target.value;
    setDuration(val);
    if (val === '1') setPrice('0.004');
    else if (val === '3') setPrice('0.010');
    else if (val === '6') setPrice('0.018');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
      <Head>
        <title>ArtBazaar - Sanatçı Pazaryeri</title>
      </Head>

      {/* Üst Menü */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 'bold' }}>
          <span>🎨</span> ArtBazaar
        </div>
        <button 
          onClick={connectWallet}
          style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Cüzdan Bağla'}
        </button>
      </nav>

      {/* Ana İçerik / Sanatçı Eser Yükleme Paneli */}
      <main style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#111827' }}>Sanat Eserini Listele</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
          Kendi dijital sanat eserlerinizi yükleyin, aylık süre seçerek pazaryerinde sergileyin.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Eser Adı</label>
            <input 
              type="text" 
              placeholder="Örn: Cyber Mona Lisa" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Açıklama</label>
            <textarea 
              placeholder="Eseriniz hakkında kısa bilgi verin..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Listeleme Süresi (Aylık)</label>
            <select 
              value={duration} 
              onChange={handleDurationChange}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
            >
              <option value="1">1 Ay (0.004 ETH)</option>
              <option value="3">3 Ay (0.010 ETH - İndirimli)</option>
              <option value="6">6 Ay (0.018 ETH - Avantajlı)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Eser Dosyası (Görsel)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              required
              style={{ width: '100%', padding: '8px', border: '1px dashed #d1d5db', borderRadius: '6px', backgroundColor: '#f9fafb' }}
            />
          </div>

          <button 
            type="submit"
            style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
          >
            Ödeme Yap ve Eseri Yayınla ({price} ETH)
          </button>
        </form>
      </main>
    </div>
  );
}
