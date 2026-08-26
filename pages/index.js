import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';

export default function Home() {
  // --- ÜYELİK VE OTURUM STATE'LERİ ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- WEB3 VE PAZARYERİ STATE'LERİ ---
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('1'); 
  const [priceEth, setPriceEth] = useState('0.003');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedArt, setSelectedArt] = useState(null);

  // --- ÖDEME YÖNTEMİ SEÇİM MODALI STATE'LERİ ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingActionType, setPendingActionType] = useState(null); // 'listing' veya 'buy'
  const [pendingArtData, setPendingArtData] = useState(null); // Satın alınacak eser bilgisi

  const [listings, setListings] = useState([
    { id: 1, title: 'Cyber Mona Lisa', description: 'Yapay zeka ve rönesans sanatının dijital sentezi.', artist: '0x123...ABCD', price: '0.04 ETH', duration: '3 Ay', image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=60' },
    { id: 2, title: 'Abstract Neon', description: 'Geleceğin sokak kültüründen ilham alan neon kompozisyon.', artist: '0x987...WXYZ', price: '0.004 ETH', duration: '1 Ay', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' }
  ]);

  // Senin Kişisel Cüzdan Adresin
  const platformWalletAddress = "0xAd58d1050942F795E651153231Ce8A152180C055";

  useEffect(() => {
    const savedUser = localStorage.getItem('efnan_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    async function calculatePrices() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=try');
        const data = await res.json();
        const ethTryRate = data.ethereum.try || 118000; 

        let targetTry = 300;
        if (duration === '3') targetTry = 850;
        if (duration === '6') targetTry = 1600;

        const calculatedEth = (targetTry / ethTryRate).toFixed(4);
        setPriceEth(calculatedEth);
      } catch (err) {
        console.error("Kur çekilemedi, varsayılan değer kullanılıyor.", err);
        if (duration === '1') setPriceEth('0.003');
        else if (duration === '3') setPriceEth('0.008');
        else if (duration === '6') setPriceEth('0.015');
      }
    }
    calculatePrices();
  }, [duration]);

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

  // --- ÖDEME SÜRECİNİ BAŞLATAN TETİKLEYİCİLER ---
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
    // Ödeme yöntemi seçim modalını aç
    setPendingActionType('listing');
    setShowPaymentModal(true);
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

  // --- 1. SEÇENEK: METAMASK İLE OTOMATİK ÖDEME ---
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

      if (pendingActionType === 'listing') {
        const weiAmount = ethers.utils.parseEther(priceEth);
        alert(`Listeleme ücreti (${priceEth} ETH) ödemesi için MetaMask açılıyor...`);

        const tx = await signer.sendTransaction({
          to: platformWalletAddress,
          value: weiAmount,
        });
        await tx.wait();

        const imageUrl = URL.createObjectURL(imageFile);
        const newListing = {
          id: listings.length + 1,
          title: title,
          description: description || 'Sanatçı tarafından açıklama girilmedi.',
          artist: `${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`,
          price: `${(parseFloat(priceEth) * 2).toFixed(3)} ETH`, 
          duration: `${duration} Ay`,
          image: imageUrl
        };

        setListings([newListing, ...listings]);
        alert(`Ödeme başarılı! Eseriniz başarıyla ${duration} aylığına Efnan ArtBazaar'da listelendi!`);
        setTitle('');
        setDescription('');
        setImageFile(null);

      } else if (pendingActionType === 'buy' && pendingArtData) {
        const numericPrice = parseFloat(pendingArtData.price.replace(' ETH', '')) || 0.01;
        const totalWei = ethers.utils.parseEther(numericPrice.toString());
        const commissionWei = totalWei.mul(10).div(100); // %10 Komisyon

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

  // --- 2. SEÇENEK: BİNANCE / BORSALAR İÇİN MANUEL ONAY ---
  const confirmManualExchangePayment = () => {
    setShowPaymentModal(false);

    if (pendingActionType === 'listing') {
      const imageUrl = URL.createObjectURL(imageFile);
      const newListing = {
        id: listings.length + 1,
        title: title,
        description: description || 'Sanatçı tarafından açıklama girilmedi.',
        artist: `${currentUser.username} (Borsa)`,
        price: `${(parseFloat(priceEth) * 2).toFixed(3)} ETH`, 
        duration: `${duration} Ay`,
        image: imageUrl
      };

      setListings([newListing, ...listings]);
      alert('Borsa transferi bildirimi alındı! Transferiniz yönetici cüzdanında onaylandığında eseriniz öne çıkanlarda sergilenecektir.');
      setTitle('');
      setDescription('');
      setImageFile(null);
    } else if (pendingActionType === 'buy' && pendingArtData) {
      alert(`"${pendingArtData.title}" için borsa transfer bildiriminiz alındı! Kontrol edildikten sonra eser sahipliği size aktarılacaktır.`);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
          <span>🎨</span> Efnan ArtBazaar
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

      {/* ANA İÇERİK */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '10px' }}>Efnan ArtBazaar'a Hoş Geldiniz</h1>
          <p style={{ color: '#4b5563', fontSize: '1.1rem' }}>Eşsiz dijital sanat eserlerini keşfedin, dilediğiniz ödeme yöntemiyle güvenle işlem yapın.</p>
        </div>

        {/* KEŞFET */}
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

        {/* ESER LİSTELEME FORMU */}
        <section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#111827' }}>Kendi Eserini Listele</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.95rem' }}>
            Eserinizi aylık süre seçenekleriyle (300 TL bazlı) pazaryerinde sergileyin.
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
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Listeleme Süresi ve Ücreti</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
              >
                <option value="1">1 Ay (~300 TL karşılığı ETH)</option>
                <option value="3">3 Ay (~850 TL - İndirimli)</option>
                <option value="6">6 Ay (~1600 TL - Avantajlı)</option>
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
              {uploading ? 'İşlem Yapılıyor...' : `Ödeme Yöntemi Seç ve Yayınla (~${priceEth} ETH)`}
            </button>
          </form>
        </section>
      </main>

      {/* --- ÖDEME YÖNTEMİ SEÇİM MODALI (YENİ) --- */}
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
              {/* SEÇENEK 1: MetaMask / Web3 Cüzdan */}
              <button 
                onClick={payWithMetaMask}
                style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}
              >
                🦊 MetaMask / Web3 Cüzdan ile Otomatik Öde
              </button>

              {/* SEÇENEK 2: Binance / Borsalar */}
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
                  placeholder="••••••••" 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} 
                />
              </div>

              <button 
                type="submit"
                style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
              >
                {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
              {authMode === 'login' ? (
                <p>Hesabınız yok mu? <span onClick={() => setAuthMode('register')} style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }}>Üye Olun</span></p>
              ) : (
                <p>Zaten hesabınız var mı? <span onClick={() => setAuthMode('login')} style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }}>Giriş Yapın</span></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ESER DETAY MODALI */}
      {selectedArt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '500px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#111827' }}>{selectedArt.title}</h2>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '16px' }}>{selectedArt.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem', color: '#6b7280' }}>
                <span>Sanatçı: <b>{selectedArt.artist}</b></span>
                <span>Süre: <b>{selectedArt.duration}</b></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setSelectedArt(null)}
                    style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Kapat
                  </button>
                  <button 
                    onClick={() => { triggerBuyProcess(selectedArt); setSelectedArt(null); }}
                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Satın Al (Ödeme Seç)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
