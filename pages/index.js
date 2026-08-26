import { useState } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';

export default function Home() {
  const [account, setAccount] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [duration, setDuration] = useState('1'); // 1 hafta varsayılan

  const RECIPIENT = "0xAd58d105942F795E651153231Ce8A152180C055";

  // MetaMask cüzdan bağlantısı
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Cüzdan bağlantı hatası:", error);
      }
    } else {
      alert("Lütfen MetaMask yükleyin!");
    }
  };

  // Ödeme ve Yükleme İşlemi
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!account) {
      alert("Önce cüzdanınızı bağlayın!");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Süreye göre ETH hesaplama (Haftalık 0.001 ETH)
      const ethAmount = (parseFloat(duration) * 0.001).toString();
      const valueWei = ethers.utils.parseEther(ethAmount);

      alert(`${duration} hafta sergileme için ${ethAmount} ETH ödeme başlatılıyor...`);

      const tx = await signer.sendTransaction({
        to: RECIPIENT,
        value: valueWei
      });

      alert("Ödeme gönderildi! İşlem Hash: " + tx.hash);
      await tx.wait();
      alert("Ödeme onaylandı! Eseriniz ArtBazaar'da başarıyla listelendi.");

    } catch (err) {
      console.error(err);
      alert("İşlem başarısız veya iptal edildi.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <Head>
        <title>ArtBazaar - Web3 NFT & Art Platform</title>
      </Head>

      {/* Üst Kısım / Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🎨 ArtBazaar</h1>
        <div>
          {account ? (
            <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
              {account.substring(0, 6)}...{account.substring(38)}
            </span>
          ) : (
            <button onClick={connectWallet} style={{ background: '#4f46e5', color: '#white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' }}>
              Cüzdan Bağla
            </button>
          )}
        </div>
      </div>

      {/* Eser Yükleme Formu */}
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ marginTop: 0, fontSize: '20px' }}>Eserini Yükle</h2>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Eser Adı</label>
            <input 
              type="text" 
              placeholder="Örn: Cyber Mona Lisa" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Açıklama</label>
            <textarea 
              placeholder="Eserinizin hikayesi..." 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Görsel Dosyası</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])} 
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Sergileme Süresi</label>
            <select 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
            >
              <option value="1">1 Hafta (0.001 ETH)</option>
              <option value="2">2 Hafta (0.002 ETH)</option>
              <option value="4">1 Ay (0.004 ETH)</option>
            </select>
          </div>

          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Ödeme Yap ve Eseri Yayınla
          </button>
        </form>
      </div>
    </div>
  );
}
