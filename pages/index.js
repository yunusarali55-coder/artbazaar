import { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ftfhfwiqbwfxolebcqdx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aGZ3aGlxYndmeG9sZWJjcWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTMyOTcsImV4cCI6MjEwMzQ2OTI5N30.efUIMqDHizg7zd4YCkiouCzX0GjpBl7AHkAz0nLpBdI'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedArt, setSelectedArt] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingArtData, setPendingArtData] = useState(null); 
  const [showExchangeInfo, setShowExchangeInfo] = useState(false);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');

  const [listings, setListings] = useState([
    { id: 1, title: 'Neon Rüya', description: 'Renklerin ve neon ışıkların büyüleyici dansı.', artist: 'Yunus Aralı', phone: '05443433881', price: '0.05 ETH', duration: 'Süresiz / Yayında', image: 'https://picsum.photos/seed/art1/1200/800', status: 'Satışta' },
    { id: 2, title: 'Kozmik Yansımalar', description: 'Uzayın ve derinlik algısının harmanlandığı eser.', artist: 'Efnan Sanat', phone: '05443433881', price: '0.08 ETH', duration: 'Süresiz / Yayında', image: 'https://picsum.photos/seed/art2/1200/800', status: 'Satışta' }
  ]);

  const platformWalletAddress = "0xAd58d1050942F795E651153231Ce8A152180C055";
  const exactHeroImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80";

  useEffect(() => {
    const savedUser = localStorage.getItem('efnan_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    const savedOrders = localStorage.getItem('efnan_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    fetchArtworksFromSupabase();
  }, []);

  const fetchArtworksFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return;

      if (data && data.length > 0) {
        const formattedArtworks = data.map((art) => ({
          id: art.id,
          title: art.title,
          description: art.description,
          artist: art.artist || 'Anonim',
          phone: art.phone || 'Belirtilmedi',
          price: art.price ? `${art.price} ETH` : '0.015 ETH',
          duration: 'Süresiz / Yayında',
          image: art.image_url || exactHeroImage,
          status: 'Satışta'
        }));
        setListings(prev => [...formattedArtworks, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email || !password || !username) return alert('Lütfen tüm alanları doldurun.');
    const newUser = { username, email };
    localStorage.setItem('efnan_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    setShowAuthModal(false);
    alert('Kayıt başarılı!');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Lütfen bilgileri girin.');
    const existingUser = { username: email.split('@')[0], email };
    localStorage.setItem('efnan_user', JSON.stringify(existingUser));
    setCurrentUser(existingUser);
    setShowAuthModal(false);
    alert('Giriş yapıldı!');
  };

  const handleLogout = () => {
    localStorage.removeItem('efnan_user');
    setCurrentUser(null);
    alert('Çıkış yapıldı.');
  };

  // Eser Ekleme Fonksiyonu (Galeriden, Bilgisayardan veya Flash Bellekten seçilen dosyayı doğrudan işler ve kalıcı kaydeder)
  const triggerListingProcess = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Eser listelemek için önce giriş yapmalısınız!');
      setShowAuthModal(true);
      return;
    }

    if (!imageFile) {
      alert('Lütfen cihazınızdan/galerinizden bir eser görseli seçin.');
      return;
    }

    setUploading(true);

    try {
      // Seçilen görseli okuyup veritabanına işlenebilir formata çeviriyoruz
      const imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(imageFile);
      });

      const { error: insertError } = await supabase
        .from('artworks')
        .insert([
          { 
            title, 
            description: description || 'Açıklama yok', 
            price: 0.015, 
            image_url: imageUrl, 
            artist: currentUser.username,
            phone: phone || 'Belirtilmedi'
          }
        ]);

      if (insertError) {
        alert('Eser eklenirken hata oluştu: ' + insertError.message);
      } else {
        alert('Eseriniz başarıyla yüklendi! Satılana veya siz kaldırana kadar vitrinde kalacaktır.');
        setTitle('');
        setDescription('');
        setPhone('');
        setImageFile(null);
        fetchArtworksFromSupabase();
      }
    } catch (err) {
      alert('Dosya işlenirken bir hata oluştu: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerBuyProcess = (art) => {
    if (!currentUser) {
      alert('Satın almak için giriş yapmalısınız!');
      setShowAuthModal(true);
      return;
    }
    setPendingArtData(art);
    setShowPaymentModal(true);
  };

  const createNewOrder = (paymentMethod) => {
    const newOrder = {
      id: Date.now(),
      artTitle: pendingArtData.title,
      artist: pendingArtData.artist,
      phone: pendingArtData.phone,
      price: pendingArtData.price,
      buyer: currentUser.username,
      paymentMethod,
      status: 'Sipariş Alındı (Hazırlanıyor)',
      date: new Date().toLocaleDateString('tr-TR')
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('efnan_orders', JSON.stringify(updatedOrders));
    setShowPaymentModal(false);
    setShowExchangeInfo(false);
    setPendingArtData(null);
    alert('Siparişiniz başarıyla oluşturuldu! "Siparişlerim" sekmesinden takip edebilirsiniz.');
    setActiveTab('my_orders');
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem('efnan_orders', JSON.stringify(updated));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <Head>
        <title>Efnan ArtBazaar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#222' }}>
          <span style={{ color: '#ff4d4d', fontWeight: '900' }}>Efnan ArtBazaar</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {currentUser ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>👤 {currentUser.username}</span>
              <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Çıkış</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>Giriş Yap</button>
          )}
        </div>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '12px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('explore')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'explore' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'explore' ? 'white' : '#374151', fontWeight: 'bold', cursor: 'pointer' }}>Keşfet & Satın Al</button>
        <button onClick={() => setActiveTab('my_orders')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'my_orders' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'my_orders' ? 'white' : '#374151', fontWeight: 'bold', cursor: 'pointer' }}>Siparişlerim ({orders.length})</button>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 12px' }}>
        {activeTab === 'explore' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <img src={exactHeroImage} alt="Hero" style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px' }} />
            </div>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '14px', color: '#1f2937' }}>Vitrin (Süresiz Yayında)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {listings.map((art) => (
                  <div key={art.id} onClick={() => setSelectedArt(art)} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                    <img src={art.image} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ padding: '12px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{art.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Sanatçı: {art.artist}</p>
                      <p style={{ fontSize: '0.8rem', color: '#059669' }}>📞 İletişim: {art.phone}</p>
                      <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '2px' }}>⏳ Durum: {art.duration}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#059669' }}>{art.price}</span>
                        <button onClick={(e) => { e.stopPropagation(); triggerBuyProcess(art); }} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>Satın Al</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Kendi Eserini Ekle (Galeriden / Cihazdan)</h2>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '14px' }}>Yüklediğiniz eser siz kaldırana veya satılana kadar vitrinde süresiz kalır.</p>
              
              <form onSubmit={triggerListingProcess} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Eser Adı" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                <textarea placeholder="Eser Açıklaması" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                <input type="text" placeholder="İletişim / Telefon Numarası (Örn: 0555...)" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                
                <div style={{ border: '1px dashed #d1d5db', padding: '10px', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
                  <label style={{ fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: '4px' }}>Görsel Seç (Galeri, Dosya, Flash Bellek vb.):</label>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required style={{ width: '100%' }} />
                </div>

                <button type="submit" disabled={uploading} style={{ backgroundColor: uploading ? '#9ca3af' : '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {uploading ? 'Yükleniyor ve Vitrine Ekleniyor...' : 'Eseri Vitrine Ekle'}
                </button>
              </form>
            </section>
          </>
        )}

        {activeTab === 'my_orders' && (
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Sipariş Takip & İletişim Paneli</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Henüz bir siparişiniz bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#111827' }}>{order.artTitle}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>Sanatçı: {order.artist} | Tel: <a href={`tel:${order.phone}`} style={{ color: '#2563eb', fontWeight: 'bold' }}>{order.phone}</a></p>
                    <p style={{ fontSize: '0.85rem', color: '#4b5563' }}>Alıcı: {order.buyer} | Ödeme: {order.paymentMethod}</p>
                    <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#eef2ff', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4f46e5' }}>Durum: {order.status}</span>
                      {currentUser && currentUser.username === order.artist && (
                        <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} style={{ padding: '4px', borderRadius: '4px', fontSize: '0.8rem' }}>
                          <option value="Sipariş Alındı (Hazırlanıyor)">Hazırlanıyor</option>
                          <option value="Kargoya Verildi (Yolda)">Kargoya Verildi (Yolda)</option>
                          <option value="Teslim Edildi">Teslim Edildi</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '20px' }}>
            <h3>Ödeme Yöntemi Seçin</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '10px 0' }}>{pendingArtData?.title} için ödeme yöntemi:</p>
            {!showExchangeInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setShowExchangeInfo(true)} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  🏦 Kripto Borsa / IBAN Transferi (Adres Göster)
                </button>
                <button onClick={() => createNewOrder('MetaMask / Web3')} style={{ backgroundColor: '#f6851b', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  🦊 MetaMask ile Öde
                </button>
                <button onClick={() => setShowPaymentModal(false)} style={{ backgroundColor: '#9ca3af', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>İptal</button>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '10px', border: '1px solid #e5e7eb' }}>
                  <p><b>Platform Cüzdan Adresi:</b></p>
                  <code style={{ wordBreak: 'break-all', color: '#d97706' }}>{platformWalletAddress}</code>
                  <p style={{ marginTop: '8px' }}><b>Tutar:</b> {pendingArtData?.price}</p>
                </div>
                <button onClick={() => createNewOrder('Borsa / IBAN Transferi')} style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', width: '100%', fontWeight: 'bold', cursor: 'pointer', marginBottom: '6px' }}>
                  Transferi Yaptım, Siparişi Tamamla
                </button>
                <button onClick={() => setShowExchangeInfo(false)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', width: '100%' }}>Geri Dön</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedArt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '1100', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '20px', position: 'relative' }}>
            <button onClick={() => setSelectedArt(null)} style={{ position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
            <h3>{selectedArt.title}</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Sanatçı: {selectedArt.artist}</p>
            <p style={{ fontSize: '0.85rem', color: '#059669', marginBottom: '8px' }}>📞 İletişim Tel: <a href={`tel:${selectedArt.phone}`} style={{ color: '#2563eb' }}>{selectedArt.phone}</a></p>
            <p style={{ fontSize: '0.9rem', marginBottom: '14px' }}>{selectedArt.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
              <button onClick={() => { const art = selectedArt; setSelectedArt(null); triggerBuyProcess(art); }} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Satın Al</button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '380px', width: '100%', padding: '20px', position: 'relative' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'none', fontSize: '1.2rem' }}>✕</button>
            <h3>{authMode === 'login' ? 'Giriş Yap' : 'Üye Ol'}</h3>
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {authMode === 'register' && (
                <input type="text" placeholder="Kullanıcı Adı" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              )}
              <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: '#6b7280' }}>
              <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }}>
                {authMode === 'login' ? 'Hesabınız yok mu? Üye Olun' : 'Zaten hesabınız var mı? Giriş Yapın'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
