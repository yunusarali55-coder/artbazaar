import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

// Supabase Bağlantı Bilgileri (Supabase panelinden aldığımız bilgiler)
const SUPABASE_URL = 'https://fthfwhiqbwfxolebcqdx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_trENam...'; // Kendi publishable key değerini buraya yapıştırabilirsin
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('1'); 
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedArt, setSelectedArt] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingActionType, setPendingActionType] = useState(null); 
  const [pendingArtData, setPendingArtData] = useState(null); 

  const [listings, setListings] = useState([]);

  const platformWalletAddress = "0xAd58d1050942F795E651153231Ce8A152180C055";
  const exactHeroImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80";

  // Sayfa yüklendiğinde kullanıcıyı ve Supabase'deki eserleri çek
  useEffect(() => {
    const savedUser = localStorage.getItem('efnan_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchArtworksFromSupabase();
  }, []);

  // Supabase'den Eserleri Çekme Fonksiyonu
  const fetchArtworksFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Eserler çekilirken hata oluştu:', error.message);
        return;
      }

      if (data && data.length > 0) {
        // Supabase sütun adlarını frontend yapısına uygun hale getiriyoruz
        const formattedArtworks = data.map((art) => ({
          id: art.id,
          title: art.title,
          description: art.description,
          artist: art.artist || 'Anonim',
          price: art.price ? `${art.price} ETH` : '0.015 ETH',
          duration: '1 Ay',
          image: art.image_url
        }));
        setListings(formattedArtworks);
      }
    } catch (err) {
      console.error('Bağlantı hatası:', err);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email || !password || !username) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }
    const newUser = { username, email };
    localStorage.setItem('efnan_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    setShowAuthModal(false);
    alert('Kayıt başarılı! Hoş geldiniz.');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    const existingUser = { username: email.split('@')[0], email };
    localStorage.setItem('efnan_user', JSON.stringify(existingUser));
    setCurrentUser(existingUser);
    setShowAuthModal(false);
    alert('Başarıyla giriş yapıldı!');
  };

  const handleLogout = () => {
    localStorage.removeItem('efnan_user');
    setCurrentUser(null);
    setAccount('');
    alert('Çıkış yapıldı.');
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const userAccount = accounts[0];
        setAccount(userAccount);

        const rawBalance = await provider.getBalance(userAccount);
        const ethBalance = ethers.utils.formatEther(rawBalance);
        setBalance(parseFloat(ethBalance).toFixed(4));
        return userAccount;
      } catch (error) {
        console.error('Cüzdan bağlantı hatası:', error);
        return null;
      }
    } else {
      alert('Lütfen tarayıcınızda veya MetaMask uygulamasında bir Web3 cüzdanı kullanın!');
      return null;
    }
  };

  // Eser Listeleme ve Supabase Storage & Database Kayıt İşlemi
  const triggerListingProcess = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Eser listelemek için önce üye girişi yapmalısınız!');
      setShowAuthModal(true);
      return;
    }
    if (!imageFile) {
      alert('Lütfen yüklenecek bir eser görseli seçin!');
      return;
    }

    setUploading(true);

    try {
      // 1. Görseli Supabase Storage ('art-imges') alanına yükle
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('art-imges')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Storage yükleme hatası:', uploadError.message);
        alert('Görsel yüklenirken hata oluştu: ' + uploadError.message);
        setUploading(false);
        return;
      }

      // 2. Yüklenen görselin Public URL adresini al
      const { data: publicUrlData } = supabase.storage
        .from('art-imges')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // 3. Bilgileri Supabase 'artworks' tablosuna kaydet
      const { error: insertError } = await supabase
        .from('artworks')
        .insert([
          { 
            title: title, 
            description: description || 'Sanatçı tarafından açıklama girilmedi.', 
            price: 0.015, 
            image_url: imageUrl, 
            artist: currentUser.username 
          }
        ]);

      if (insertError) {
        console.error('Veritabanı kayıt hatası:', insertError.message);
        alert('Eser veritabanına kaydedilemedi: ' + insertError.message);
      } else {
        alert(`Tebrikler! Eseriniz Efnan projesinde kalıcı olarak başarıyla listelendi!`);
        setTitle('');
        setDescription('');
        setImageFile(null);
        // Listeyi tazele
        fetchArtworksFromSupabase();
      }
    } catch (err) {
      console.error('İşlem hatası:', err);
      alert('Beklenmeyen bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const triggerBuyProcess = (art) => {
    if (!currentUser) {
      alert('Satın alma yapabilmek için önce üye girişi yapmalısınız!');
      setShowAuthModal(true);
      return;
    }
    setPendingArtData(art);
    setPendingActionType('buy');
    setShowPaymentModal(true);
  };

  const payWithMetaMask = async () => {
    setShowPaymentModal(false);
    setUploading(true);

    try {
      let currentAccount = account;
      if (!currentAccount) {
        currentAccount = await connectWallet();
        if (!currentAccount) {
          setUploading(false);
          return;
        }
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      if (pendingActionType === 'buy' && pendingArtData) {
        const numericPrice = parseFloat(pendingArtData.price.replace(' ETH', '')) || 0.01;
        const totalWei = ethers.utils.parseEther(numericPrice.toString());
        const commissionWei = totalWei.mul(10).div(100); 

        alert(`${pendingArtData.title} için ödeme yapılıyor. %10 platform komisyonu cüzdanınıza aktarılıyor...`);

        const txPlatform = await signer.sendTransaction({
          to: platformWalletAddress,
          value: commissionWei,
        });
        await txPlatform.wait();

        alert(`Tebrikler! ${pendingArtData.title} başarıyla satın alındı.`);
      }
    } catch (error) {
      console.error('MetaMask ödeme hatası:', error);
      alert('İşlem iptal edildi veya bir hata oluştu.');
    } finally {
      setUploading(false);
      setPendingActionType(null);
      setPendingArtData(null);
    }
  };

  const confirmManualExchangePayment = () => {
    setShowPaymentModal(false);
    if (pendingActionType === 'buy' && pendingArtData) {
      alert(`"${pendingArtData.title}" için borsa transfer bildiriminiz alındı!`);
    }
    setPendingActionType(null);
    setPendingArtData(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <Head>
        <title>Efnan ArtBazaar - Dijital Sanat Pazaryeri</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* ÜST MENÜ */}
      <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10, gap: '10px' }}>
        
        {/* RENKLİ SİTE İSMİ */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          backgroundColor: '#222',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🕊️</span>
          
          <div style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#ff4d4d' }}>E</span>
            <span style={{ color: '#ffa500' }}>f</span>
            <span style={{ color: '#ffff33' }}>n</span>
            <span style={{ color: '#33cc33' }}>a</span>
            <span style={{ color: '#3399ff' }}>n </span>
            <span style={{ color: '#cc33ff' }}>A</span>
            <span style={{ color: '#ff66b2' }}>r</span>
            <span style={{ color: '#00ffff' }}>t</span>
            <span style={{ color: '#ff9900' }}>B</span>
            <span style={{ color: '#99ff33' }}>a</span>
            <span style={{ color: '#ff3366' }}>z</span>
            <span style={{ color: '#33ffff' }}>a</span>
            <span style={{ color: '#ffff66' }}>a</span>
            <span style={{ color: '#ff33ff' }}>r</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '500', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👤 {currentUser.username}</span>
              <button 
                onClick={handleLogout}
                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Çıkış
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              Giriş Yap / Üye Ol
            </button>
          )}

          {account && (
            <span style={{ fontSize: '0.8rem', backgroundColor: '#eef2ff', color: '#4f46e5', padding: '6px 8px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              💎 {balance} ETH
            </span>
          )}
        </div>
      </nav>

      {/* ANA İÇERİK */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 12px' }}>
        
        {/* ÖZEL RESİM ALANI */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', backgroundColor: '#111' }}>
            <img 
              src={exactHeroImage} 
              alt="Anlamlı Sanat Görseli" 
              style={{ width: '100%', height: '320px', objectFit: 'cover' }} 
            />
          </div>
          <p style={{ color: '#4b5563', fontSize: '1rem', marginTop: '16px', padding: '0 10px' }}>Eşsiz dijital sanat eserlerini keşfedin, eserlerinizi tamamen ücretsiz listeleyin.</p>
        </div>

        {/* KEŞFET & SATIN AL */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Keşfet & Satın Al</h2>
          
          {listings.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Henüz listelenmiş bir eser bulunmuyor. İlk eseri sen yükle!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {listings.map((art) => (
                <div 
                  key={art.id} 
                  onClick={() => setSelectedArt(art)}
                  style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                  <img src={art.image} alt={art.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: '#111827' }}>{art.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '10px' }}>Sanatçı: {art.artist}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#059669' }}>{art.price}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); triggerBuyProcess(art); }}
                        style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                      >
                        Satın Al
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ESER LİSTELEME FORMU */}
        <section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '6px', color: '#111827' }}>Kendi Eserini Ücretsiz Listele</h2>
          <p style={{ color: '#6b7280', marginBottom: '18px', fontSize: '0.9rem' }}>
            Eserinizi dilediğiniz süre seçeneğiyle pazaryerinde tamamen ücretsiz sergileyin.
          </p>

          <form onSubmit={triggerListingProcess} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', color: '#374151', fontSize: '0.9rem' }}>Eser Adı</label>
              <input 
                type="text" 
                placeholder="Örn: Future Space" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', color: '#374151', fontSize: '0.9rem' }}>Açıklama</label>
              <textarea 
                placeholder="Eseriniz hakkında kısa bilgi verin..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', color: '#374151', fontSize: '0.9rem' }}>Listeleme Süresi</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', fontSize: '0.95rem' }}
              >
                <option value="1">1 Ay (Ücretsiz)</option>
                <option value="3">3 Ay (Ücretsiz)</option>
                <option value="6">6 Ay (Ücretsiz)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', color: '#374151', fontSize: '0.9rem' }}>Eser Dosyası (Görsel)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                required
                style={{ width: '100%', padding: '8px', border: '1px dashed #d1d5db', borderRadius: '6px', backgroundColor: '#f9fafb', fontSize: '0.85rem' }}
              />
            </div>

            <button 
              type="submit"
              disabled={uploading}
              style={{ backgroundColor: uploading ? '#9ca3af' : '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', marginTop: '6px' }}
            >
              {uploading ? 'Yükleniyor & Kaydediliyor...' : 'Hemen Ücretsiz Yayınla'}
            </button>
          </form>
        </section>
      </main>

      {/* MODALLAR */}
      {selectedArt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setSelectedArt(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '6px' }}>{selectedArt.title}</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '10px' }}>Sanatçı: {selectedArt.artist} ({selectedArt.duration})</p>
            <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '14px' }}>{selectedArt.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
              <button 
                onClick={() => { const art = selectedArt; setSelectedArt(null); triggerBuyProcess(art); }}
                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
              >
                Hemen Satın Al
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '420px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', color: '#111827', fontWeight: 'bold' }}>Ödeme Yöntemi Seçin</h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '16px' }}>
              Lütfen ödemeyi yapmak istediğiniz yöntemi seçin:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={payWithMetaMask}
                style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}
              >
                🦊 MetaMask / Web3 Cüzdan ile Öde
              </button>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
                <p style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px', fontSize: '0.9rem' }}>
                  📊 Binance / Paribu / Diğer Borsalar ile Öde
                </p>
                <p style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '8px' }}>
                  Aşağıdaki cüzdan adresimize borsanızdan transfer yapın:
                </p>
                <div style={{ backgroundColor: 'white', padding: '6px', borderRadius: '4px', border: '1px dashed #d1d5db', fontSize: '0.7rem', wordBreak: 'break-all', fontWeight: 'mono', color: '#374151', marginBottom: '8px' }}>
                  {platformWalletAddress}
                </div>
                <button 
                  onClick={confirmManualExchangePayment}
                  style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Borsadan Transferi Yaptım, Bildir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '380px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', color: '#111827', fontWeight: 'bold' }}>{authMode === 'login' ? 'Giriş Yap' : 'Üye Ol'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authMode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Adınız" 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} 
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>E-posta Adresi</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="ornek@mail.com" 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Şifre</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="********" 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} 
                />
              </div>
              <button 
                type="submit" 
                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', fontSize: '0.95rem' }}
              >
                {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                {authMode === 'login' ? 'Hesabınız yok mu? Üye olun' : 'Zaten hesabınız var mı? Giriş yapın'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
