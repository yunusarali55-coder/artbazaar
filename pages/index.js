import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';

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

  const [listings, setListings] = useState([
    { id: 1, title: 'Cyber Mona Lisa', description: 'Yapay zeka ve rönesans sanatının dijital sentezi.', artist: '0x123...ABCD', price: '0.04 ETH', duration: '3 Ay', image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=60' },
    { id: 2, title: 'Abstract Neon', description: 'Geleceğin sokak kültüründen ilham alan neon kompozisyon.', artist: '0x987...WXYZ', price: '0.004 ETH', duration: '1 Ay', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' }
  ]);

  const platformWalletAddress = "0xAd58d1050942F795E651153231Ce8A152180C055";

  useEffect(() => {
    const savedUser = localStorage.getItem('efnan_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

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

  const triggerListingProcess = (e) => {
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

    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = () => {
      const base64Image = reader.result;
      const newListing = {
        id: listings.length + 1,
        title: title,
        description: description || 'Sanatçı tarafından açıklama girilmedi.',
        artist: currentUser.username,
        price: '0.015 ETH', 
        duration: `${duration} Ay`,
        image: base64Image
      };

      setListings([newListing, ...listings]);
      alert(`Tebrikler! Eseriniz hiçbir ücret ödemeden ${duration} aylığına başarıyla listelendi!`);
      setTitle('');
      setDescription('');
      setImageFile(null);
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Görsel yüklenirken bir hata oluştu.');
      setUploading(false);
    };
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', position: 'relative' }}>
      <Head>
        <title>Efnan ArtBazaar - Dijital Sanat Pazaryeri</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* ÜST MENÜ */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        
        {/* RENKLİ SİTE İSMİ */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '10px 18px', 
          borderRadius: '10px', 
          overflow: 'hidden',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.6)',
          backgroundColor: '#222'
        }}>
          <span style={{ fontSize: '1.4rem', zIndex: 2 }}>🕊️</span>
          
          <div style={{ fontSize: '1.35rem', fontWeight: '900', zIndex: 2, letterSpacing: '0.5px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '500' }}>👤 {currentUser.username}</span>
              <button 
                onClick={handleLogout}
                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Çıkış
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Giriş Yap / Üye Ol
            </button>
          )}

          {account && (
            <span style={{ fontSize: '0.85rem', backgroundColor: '#eef2ff', color: '#4f46e5', padding: '6px 10px', borderRadius: '20px', fontWeight: '600' }}>
              💎 {balance} ETH
            </span>
          )}
        </div>
      </nav>

      {/* ANA İÇERİK - İSTEDİĞİNİZ ANLAMLI TEMA GÖRSELİ */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Ortadaki Resim Alanı */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', backgroundColor: '#111' }}>
            <img 
              src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80" 
              alt="Anlamlı Mücadele ve Umut" 
              style={{ width: '100%', height: '380px', objectFit: 'cover', filter: 'brightness(90%) contrast(110%)' }} 
            />
          </div>
          <p style={{ color: '#4b5563', fontSize: '1.1rem', marginTop: '20px' }}>Eşsiz dijital sanat eserlerini keşfedin, eserlerinizi tamamen ücretsiz listeleyin.</p>
        </div>

        {/* KEŞFET & SATIN AL */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '20px', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>Keşfet & Satın Al</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {listings.map((art) => (
              <div 
                key={art.id} 
                onClick={() => setSelectedArt(art)}
                style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s' }}
              >
                <img src={art.image} alt={art.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#111827' }}>{art.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>Sanatçı: {art.artist}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#059669' }}>{art.price}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerBuyProcess(art); }}
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

        {/* ESER LİSTELEME FORMU (ÜCRETSİZ) */}
        <section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#111827' }}>Kendi Eserini Ücretsiz Listele</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
            Eserinizi dilediğiniz süre seçeneğiyle pazaryerinde tamamen ücretsiz sergileyin.
          </p>

          <form onSubmit={triggerListingProcess} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Listeleme Süresi</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
              >
                <option value="1">1 Ay (Ücretsiz)</option>
                <option value="3">3 Ay (Ücretsiz)</option>
                <option value="6">6 Ay (Ücretsiz)</option>
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
              disabled={uploading}
              style={{ backgroundColor: uploading ? '#9ca3af' : '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', marginTop: '10px' }}
            >
              {uploading ? 'Yükleniyor...' : 'Hemen Ücretsiz Yayınla'}
            </button>
          </form>
        </section>
      </main>

      {/* --- ESER DETAY MODALI --- */}
      {selectedArt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '25px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button onClick={() => setSelectedArt(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '10px', marginBottom: '15px' }} />
            <h2 style={{ fontSize: '1.4rem', color: '#111827', marginBottom: '8px' }}>{selectedArt.title}</h2>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '12px' }}>Sanatçı: {selectedArt.artist} ({selectedArt.duration})</p>
            <p style={{ fontSize: '0.95rem', color: '#374151', marginBottom: '16px' }}>{selectedArt.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
              <button 
                onClick={() => { const art = selectedArt; setSelectedArt(null); triggerBuyProcess(art); }}
                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Hemen Satın Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ÖDEME YÖNTEMİ SEÇİM MODALI --- */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '450px', width: '100%', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#111827', fontWeight: 'bold' }}>Ödeme Yöntemi Seçin</h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '20px' }}>
              Lütfen ödemeyi yapmak istediğiniz yöntemi seçin:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={payWithMetaMask}
                style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}
              >
                🦊 MetaMask / Web3 Cüzdan ile Öde
              </button>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', backgroundColor: '#f9fafb' }}>
                <p style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '6px', fontSize: '0.95rem' }}>
                  📊 Binance / Paribu / Diğer Borsalar ile Öde
                </p>
                <p style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '10px' }}>
                  Aşağıdaki kişisel cüzdan adresimize borsanızdan transfer yapın:
                </p>
                <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px dashed #d1d5db', fontSize: '0.75rem', wordBreak: 'break-all', fontWeight: 'mono', color: '#374151', marginBottom: '10px' }}>
                  {platformWalletAddress}
                </div>
                <button 
                  onClick={confirmManualExchangePayment}
                  style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Borsadan Transferi Yaptım, Bildir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GİRİŞ / ÜYE OL MODALI */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>{authMode === 'login' ? 'Giriş Yap' : 'Üye Ol'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Adınız" 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} 
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>E-posta Adresi</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="ornek@mail.com" 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Şifre</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="********" 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} 
                />
              </div>
              <button 
                type="submit" 
                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
              >
                {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem' }}
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
