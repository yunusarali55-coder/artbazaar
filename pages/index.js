import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setWalletConnected(true);
      } catch (error) {
        console.error("Cüzdan bağlantısı reddedildi", error);
      }
    } else {
      alert("Lütfen MetaMask veya uyumlu bir Web3 cüzdanı yükleyin!");
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh', margin: 0, padding: 0 }}>
      <Head>
        <title>Efnan ArtBazaar</title>
        <meta name="description" content="Efnan ArtBazaar ile eşsiz dijital sanat eserlerini keşfedin, eserlerinizi tamamen ücretsiz listeleyin." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Üst Menü */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', backgroundColor: '#fff', borderBottom: '1px solid #eaeaea' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ backgroundColor: '#000', color: '#fff', padding: '8px 12px', fontWeight: 'bold', borderRadius: '4px' }}>Efnan ArtBazaar</span>
        </div>
        <button 
          onClick={connectWallet}
          style={{ backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {walletConnected ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Giriş Yap / Üye Ol'}
        </button>
      </header>

      {/* Ana İçerik */}
      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Ortadaki Siyah Başlık Kaldırıldı, Yerine İstediğin Resim Eklendi */}
        <div style={{ textAlign: 'center', margin: '30px 0 50px 0' }}>
          <img 
            src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80" 
            alt="Anlamlı Eser" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              maxHeight: '450px', 
              borderRadius: '16px', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              objectFit: 'cover'
            }} 
          />
          <p style={{ color: '#666', marginTop: '15px', fontSize: '16px' }}>Eşsiz dijital sanat eserlerini keşfedin, eserlerinizi tamamen ücretsiz listeleyin.</p>
        </div>

        <section>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>Keşfet & Satın Al</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Ürün 1 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
              <div style={{ width: '100%', height: '200px', backgroundColor: '#3498db', borderRadius: '8px', marginBottom: '15px', background: 'linear-gradient(135deg, #1abc9c, #3498db)' }}></div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Cyber Mona Lisa</h3>
              <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '0 0 15px 0' }}>Sanatçı: 0x123...ABCD</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#27ae60' }}>0.04 ETH</span>
                <button style={{ backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Satın Al</button>
              </div>
            </div>

            {/* Ürün 2 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
              <div style={{ width: '100%', height: '200px', backgroundColor: '#9b59b6', borderRadius: '8px', marginBottom: '15px', background: 'linear-gradient(135deg, #e67e22, #e74c3c)' }}></div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Abstract Neon</h3>
              <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '0 0 15px 0' }}>Sanatçı: 0x987...WXYZ</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#27ae60' }}>0.004 ETH</span>
                <button style={{ backgroundColor: '#2ecc71', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Satın Al</button>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
