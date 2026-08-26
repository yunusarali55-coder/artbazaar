import { useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';

export default function Home() {
  const [account, setAccount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('1'); 
  const [price, setPrice] = useState('0.004'); 
  const [imageFile, setImageFile] = useState(null);

  // Platform sahibinin kişisel ETH cüzdan adresi (İleride kendi MetaMask adresini buraya yazabilirsin)
  const ADMIN_ETH_WALLET = "0xSeninKisiselEthCüzdanAdresinBurayaGelecek";

  const [listings, setListings] = useState([
    { id: 1, title: 'Cyber Mona Lisa', artist: '0x123...ABCD', price: '0.04 ETH', duration: '3 Ay', image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=60' },
    { id: 2, title: 'Abstract Neon', artist: '0x987...WXYZ', price: '0.004 ETH', duration: '1 Ay', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' }
  ]);

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

  const handleDurationChange = (e) => {
    const val = e.target.value;
    setDuration(val);
    if (val === '1') setPrice('0.004');
    else if (val === '3') setPrice('0.010');
    else if (val === '6') setPrice('0.018');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      alert('Lütfen önce cüzdanınızı bağlayın!');
      return;
    }
    
    alert(`Eser başarıyla işleme alındı!\n\nSeçilen Süre: ${duration} Ay\nÖdenecek Tutar: ${price} ETH\n\n(Not: İleride gerçek akıllı kontrat bağlandığında ödeme otomatik olarak cüzdanınıza aktarılacaktır.)`);
    
    setTitle('');
    setDescription('');
    setImageFile(null);
  };

  const buyArt = (artTitle, artPrice) => {
    if (!account) {
      alert('Satın almak için lütfen önce cüzdanınızı bağlayın!');
      return;
    }
    alert(`${artTitle} adlı eser için ${artPrice} ödeme işlemi başlatılıyor...`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <Head>
        <title>Efnan ArtBazaar - Dijital Sanat Pazaryeri</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
          <span>🎨</span> Efnan ArtBazaar
        </div>
        <button 
          onClick={connectWallet}
          style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Cüzdan Bağla'}
        </button>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '10px' }}>Efnan ArtBazaar'a Hoş Geldiniz</h1>
          <p style={{ color: '#4b5563', fontSize: '1.1rem' }}>Eşsiz dijital sanat eserlerini keşfedin, satın alın veya kendi eserlerinizi aylık periyotlarla sergileyin.</p>
        </div>

        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '20px', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>Keşfet & Satın Al</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {listings.map((art) => (
              <div key={art.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                <img src={art.image} alt={art.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#111827' }}>{art.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>Sanatçı: {art.artist}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#059669' }}>{art.price}</span>
                    <button 
                      onClick={() => buyArt(art.title, art.price)}
                      style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Satın Al
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#111827' }}>Kendi Eserini Listele</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
            Eserinizi aylık süre seçenekleriyle pazaryerinde milyonlarla buluşturun.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Eser Adı</label>
              <input 
                type="text" 
                placeholder="Örn: Future Space" 
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
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Listeleme Süresi ve Ücreti (ETH)</label>
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
              Listeleme Ücretini Öde ({price} ETH) ve Yayınla
            </button>
          </form>
        </section>

      </main>
    </div>
  );
}
