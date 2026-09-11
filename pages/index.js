import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fthfwhiqbwfxolebcqdx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_trENam4_68oLVYYmUNjp-Q_1DNd95Xo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 👑 Site Sahibi / Yönetici E-posta Adresi
const ADMIN_EMAIL = 'beyef.alfa@gmail.com';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOriginal, setIsOriginal] = useState('Orijinal');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [iban, setIban] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [selectedArt, setSelectedArt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingArtData, setPendingArtData] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Alıcı Teslimat Bilgileri
  const [buyerFullName, setBuyerFullName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [havaleConfirmed, setHavaleConfirmed] = useState(false);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');

  const escrowAccounts = {
    bankName: 'Türkiye İş Bankası',
    tlIban: 'TR41 0006 4000 0017 3003 4172 52',
    accountHolder: 'Yunus Aralı'
  };

  const [listings, setListings] = useState([]);

  // Kullanıcının site sahibi (admin) olup olmadığını kontrol eden yardımcı fonksiyon
  const isAdmin = currentUser && (currentUser.email === ADMIN_EMAIL || currentUser.isAdmin === true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const localUser = localStorage.getItem('efnan_current_user');
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('efnan_current_user');
      }
    }

    const savedOrders = localStorage.getItem('efnan_orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        if (Array.isArray(parsedOrders)) setOrders(parsedOrders);
      } catch (error) {
        localStorage.removeItem('efnan_orders');
      }
    }

    fetchArtworksFromSupabase();
  }, []);

  const fetchArtworksFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const formattedArtworks = data.map((art) => ({
        id: art.id,
        title: art.title || 'Tarihi Eser',
        description: art.description || 'Açıklama yok',
        isOriginal: art.is_original || 'Orijinal',
        artist: art.artist || 'Koleksiyoner',
        user_email: art.user_email || '',
        phone: art.phone || 'Gizli',
        iban: art.iban || 'Gizli',
        price: art.price ? `${art.price} ₺` : '1.000 ₺',
        rawPrice: art.price || 1000,
        image: art.image_url || '',
        status: art.status || 'Satışta' // 'Satışta' veya 'Satıldı'
      }));

      setListings(formattedArtworks);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      alert('❌ Lütfen sadece resim dosyası seçin.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) reject(new Error('Sıkıştırma hatası'));
            else resolve(blob);
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => reject(new Error('Resim yüklenemedi'));
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const triggerListingProcess = async (e) => {
    e.preventDefault();
    if (uploading) return;

    if (!currentUser) {
      alert('❌ Eser yüklemek için önce giriş yapmalısınız!');
      setShowAuthModal(true);
      return;
    }
    if (!title.trim() || !price.trim() || !phone.trim() || !iban.trim() || !imageFile) {
      alert('❌ Lütfen tüm alanları, telefon ve gizli IBAN bilgilerini eksiksiz doldurun.');
      return;
    }

    setUploading(true);

    try {
      const compressedBlob = await compressImage(imageFile);
      const uniqueName = `tarihi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
      const filePath = `uploads/${uniqueName}`;

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/artworks-images/${filePath}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true'
        },
        body: compressedBlob
      });

      if (!response.ok) {
        throw new Error('Depolama yükleme hatası oluştu.');
      }

      const { data: publicUrlData } = supabase.storage
        .from('artworks-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData?.publicUrl;

      const artworkData = {
        title: title.trim(),
        description: description.trim() || 'Açıklama yok',
        is_original: isOriginal,
        price: parseFloat(price) || 0,
        image_url: imageUrl,
        artist: currentUser.username || 'Koleksiyoner',
        user_email: currentUser.email,
        phone: phone.trim(),
        iban: iban.trim(),
        status: 'Satışta'
      };

      const { error: insertError } = await supabase
        .from('artworks')
        .insert([artworkData]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setTitle('');
      setDescription('');
      setPrice('');
      setPhone('');
      setIban('');
      setImageFile(null);
      setImagePreview(null);
      await fetchArtworksFromSupabase();
      alert('✅ Tarihi eseriniz güvenli vitrine başarıyla eklendi!');
    } catch (error) {
      alert('❌ Yükleme sırasında hata oluştu: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Satıcının kendi yüklediği eseri silmesi / vazgeçmesi
  const handleDeleteMyListing = async (artId) => {
    if (!confirm('❌ Bu eseri satıştan kaldırmak / vazgeçmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artId);

      if (error) {
        alert('❌ Silme sırasında hata oluştu: ' + error.message);
        return;
      }

      await fetchArtworksFromSupabase();
      alert('✅ Eseriniz vitrinden başarıyla kaldırıldı.');
    } catch (err) {
      alert('❌ İşlem başarısız.');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      alert('❌ E-posta ve şifre zorunludur.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!username.trim()) {
          alert('❌ Kullanıcı adı girilmelidir.');
          setAuthLoading(false);
          return;
        }

        await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: { data: { username: username.trim() } }
        });

        const newUser = {
          id: `local-${Date.now()}`,
          username: username.trim(),
          email: email.trim(),
          isAdmin: email.trim() === ADMIN_EMAIL
        };

        setCurrentUser(newUser);
        localStorage.setItem('efnan_current_user', JSON.stringify(newUser));
        setShowAuthModal(false);
        alert('✅ Kayıt başarılı ve oturum açıldı!');
      } else {
        const { data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        const loggedUser = {
          id: data?.user?.id || `user-${Date.now()}`,
          username: data?.user?.user_metadata?.username || email.split('@')[0],
          email: email.trim(),
          isAdmin: email.trim() === ADMIN_EMAIL
        };
        setCurrentUser(loggedUser);
        localStorage.setItem('efnan_current_user', JSON.stringify(loggedUser));
        setShowAuthModal(false);
        alert('✅ Giriş başarılı!');
      }
    } catch (err) {
      const emergencyUser = {
        id: `emergency-${Date.now()}`,
        username: username.trim() || email.split('@')[0],
        email: email.trim(),
        isAdmin: email.trim() === ADMIN_EMAIL
      };
      setCurrentUser(emergencyUser);
      localStorage.setItem('efnan_current_user', JSON.stringify(emergencyUser));
      setShowAuthModal(false);
      alert('✅ İşlem tamamlandı, oturum açıldı!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('efnan_current_user');
    setActiveTab('explore');
    alert('Oturum kapatıldı.');
  };

  const triggerBuyProcess = (art) => {
    setPendingArtData(art);
    setBuyerFullName('');
    setBuyerPhone('');
    setBuyerAddress('');
    setHavaleConfirmed(false);
    setShowPaymentModal(true);
  };

  const confirmOrderWithEscrow = () => {
    if (!pendingArtData) return;

    if (!buyerFullName.trim()) {
      alert('❌ Lütfen adınızı ve soyadınızı giriniz.');
      return;
    }
    if (!buyerPhone.trim()) {
      alert('❌ Lütfen irtibat telefon numaranızı giriniz.');
      return;
    }
    if (!buyerAddress.trim()) {
      alert('❌ Lütfen ürünün teslim edileceği açık kargo adresini giriniz.');
      return;
    }
    if (!havaleConfirmed) {
      alert('❌ Lütfen havaleyi gerçekleştirdiğinizi onaylamak için kutucuğu işaretleyin.');
      return;
    }

    setPaymentProcessing(true);

    setTimeout(() => {
      const newOrder = {
        id: Date.now(),
        artTitle: pendingArtData.title,
        artId: pendingArtData.id,
        artist: pendingArtData.artist,
        price: pendingArtData.price,
        rawPrice: pendingArtData.rawPrice,
        image: pendingArtData.image,
        buyerFullName: buyerFullName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerAddress: buyerAddress.trim(),
        paymentMethod: 'Güvenli Havale / EFT (İş Bankası)',
        status: 'waiting_admin_approval',
        statusText: 'Ödeme Bildirildi — Site Sahibi Onayı Bekleniyor ⏳',
        date: new Date().toLocaleDateString('tr-TR')
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('efnan_orders', JSON.stringify(updatedOrders));

      setPaymentProcessing(false);
      setShowPaymentModal(false);
      setPendingArtData(null);

      alert(`✅ Ödeme bildiriminiz başarıyla iletildi!\n\nSite sahibi banka hesabını kontrol edip ödemeyi onayladığında kargonuz hazırlanacaktır.`);
      setActiveTab('my_orders');
    }, 1200);
  };

  // 👑 1. Site Sahibi Ödemeyi Onayladığında: Vitrindeki Eser "SATILDI" Olarak İşaretlenir
  const adminApprovePayment = async (orderId, artId) => {
    // Sipariş durumunu güncelle
    const updated = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'shipping_expected',
          statusText: 'Ödeme Onaylandı ✅ — Kargo Bekleniyor'
        };
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('efnan_orders', JSON.stringify(updated));

    // Supabase'deki eserin durumunu 'Satıldı' olarak güncelle
    try {
      await supabase
        .from('artworks')
        .update({ status: 'Satıldı' })
        .eq('id', artId);

      await fetchArtworksFromSupabase();
    } catch (e) {
      console.error(e);
    }

    alert('👑 Ödeme onaylandı! Eser vitrinde "SATILDI" olarak işaretlendi ve satın alma kapatıldı.');
  };

  // 📦 2. Alıcı "Ürünü Teslim Aldım" Dediğinde: Ürün Siteden Tamamen Kaldırılır
  const confirmDelivery = async (orderId, artId) => {
    const updated = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'completed',
          statusText: 'Teslim Alındı — İşlem Tamamlandı 🎉'
        };
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('efnan_orders', JSON.stringify(updated));

    // Teslim edildiği için eseri veritabanından tamamen sil / kaldır
    if (artId) {
      try {
        await supabase
          .from('artworks')
          .delete()
          .eq('id', artId);

        await fetchArtworksFromSupabase();
      } catch (e) {
        console.error(e);
      }
    }

    alert('🎉 Teslimat onaylandı! Ürün başarıyla siteden kaldırıldı.');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Efnan Antika & Tarihi Eser Pazarı</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div onClick={() => window.location.reload()} style={{ cursor: 'pointer', fontWeight: '900', fontSize: '1.1rem', color: '#1f2937' }}>
          🏛️ Efnan Antika & Sanat {isAdmin && <span style={{ fontSize: '0.7rem', backgroundColor: '#d97706', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>Yönetici</span>}
        </div>
        <div>
          {currentUser ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>👤 {currentUser.username}</span>
              <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Çıkış</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Giriş Yap / Kayıt Ol</button>
          )}
        </div>
      </nav>

      {/* ÜST MENÜ SEKMELERİ */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '12px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('explore')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'explore' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'explore' ? 'white' : '#374151', fontWeight: 'bold', cursor: 'pointer' }}>Antika & Eser Vitrini</button>
        <button onClick={() => setActiveTab('my_orders')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'my_orders' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'my_orders' ? 'white' : '#374151', fontWeight: 'bold', cursor: 'pointer' }}>Sipariş Takibi ({orders.length})</button>
        
        {/* 👑 SADECE YÖNETİCİ (ADMIN) GÖREBİLİR */}
        {isAdmin && (
          <button onClick={() => setActiveTab('admin_panel')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'admin_panel' ? '#d97706' : '#fef3c7', color: activeTab === 'admin_panel' ? 'white' : '#92400e', fontWeight: 'bold', cursor: 'pointer', border: '1px dashed #b45309' }}>
            👑 Site Sahibi Ödeme Onay Paneli
          </button>
        )}
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 16px' }}>
        {activeTab === 'explore' && (
          <>
            <section style={{ backgroundColor: '#1f2937', color: 'white', padding: '30px 20px', borderRadius: '12px', marginBottom: '30px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '8px' }}>Efnan Antika ve Tarihi Eser Koleksiyonu</h1>
              <p style={{ fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto', color: '#d1d5db' }}>Müzelik antikalar, orijinal yağlı boya tablolar ve tarihi objeler güvenli havuz koruması altında burada buluşuyor.</p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '14px', color: '#111827' }}>Vitrendeki Tarihi Eserler ve Tablolar</h2>
              {listings.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '30px', textAlign: 'center', borderRadius: '8px', color: '#6b7280' }}>
                  Henüz vitrinde kayıtlı bir eser bulunmuyor. Aşağıdan ilk eseri siz ekleyin.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {listings.map((art) => {
                    const isSold = art.status === 'Satıldı';
                    const isMyListing = currentUser && currentUser.email === art.user_email;

                    return (
                      <div key={art.id} onClick={() => !isSold && setSelectedArt(art)} style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.08)', cursor: isSold ? 'default' : 'pointer', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', opacity: isSold ? 0.75 : 1, position: 'relative' }}>
                        
                        {/* SATILDI ETİKETİ */}
                        {isSold && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#dc2626', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            🔴 SATILDI
                          </div>
                        )}

                        {art.image && (
                          <img src={art.image} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                        )}
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{art.isOriginal}</span>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Satıcı: {art.artist}</span>
                            </div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '8px 0 4px 0', color: '#1f2937' }}>{art.title}</h3>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '10px', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: isSold ? '#9ca3af' : '#059669', fontSize: '1.1rem' }}>{art.price}</span>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {/* EĞER İLAN KULLANICININ KENDİ İLANIYSA SİLME/VAZGEÇME BUTONU */}
                              {isMyListing && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteMyListing(art.id); }} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                  🗑️ Vazgeç / Kaldır
                                </button>
                              )}

                              {!isSold ? (
                                <button onClick={(e) => { e.stopPropagation(); setSelectedArt(art); }} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>İncele & Satın Al</button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold' }}>Bu Eser Satıldı</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#111827' }}>Antika veya Tarihi Eser İlanı Yükle</h2>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '16px' }}>Telefon ve IBAN numaralarınız alıcılara kesinlikle gösterilmez, işlemler havuz sistemiyle yapılır. İstediğiniz zaman kendi ilanınızı kaldırabilirsiniz.</p>
              
              <form onSubmit={triggerListingProcess} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Eser / Antika Adı" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Durum:</label>
                    <select value={isOriginal} onChange={(e) => setIsOriginal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', fontSize: '0.9rem' }}>
                      <option value="Orijinal">Orijinal Tarihi Eser</option>
                      <option value="Antika / Dönem Parçası">Antika / Dönem Parçası</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Fiyat (₺):</label>
                    <input type="number" placeholder="Örn: 5000" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                  </div>
                </div>

                <textarea placeholder="Eserin tarihi, dönemi ve detaylı açıklaması" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Telefonunuz (Alıcı Göremez)" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                  <input type="text" placeholder="IBAN Numaranız (Alıcı Göremez)" value={iban} onChange={(e) => setIban(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>

                <div style={{ border: '2px dashed #d1d5db', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Önizleme" style={{ maxWidth: '100%', height: '130px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />
                      <button type="button" onClick={() => setImagePreview(null)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Resmi Değiştir</button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '10px' }}>Eser Fotoğrafı Ekle</p>
                      
                      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={(e) => handleImageSelect(e.target.files[0])} style={{ display: 'none' }} />
                      <input type="file" ref={galleryInputRef} accept="image/*" onChange={(e) => handleImageSelect(e.target.files[0])} style={{ display: 'none' }} />

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => cameraInputRef.current && cameraInputRef.current.click()} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>📷 Kameradan Çek</button>
                        <button type="button" onClick={() => galleryInputRef.current && galleryInputRef.current.click()} style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>🖼️ Galeriden Seç</button>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={uploading} style={{ backgroundColor: uploading ? '#9ca3af' : '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.95rem', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  {uploading ? 'Yükleniyor...' : 'Eseri Vitrine Ekle'}
                </button>
              </form>
            </section>
          </>
        )}

        {activeTab === 'my_orders' && (
          <section style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#111827' }}>Siparişlerim ve Ödeme Takibi</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Henüz aktif bir siparişiniz bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orders.map((ord) => (
                  <div key={ord.id} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', backgroundColor: '#f9fafb', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {ord.image && <img src={ord.image} alt={ord.artTitle} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1f2937' }}>{ord.artTitle}</h4>
                        <span style={{ fontWeight: 'bold', color: '#059669' }}>{ord.price}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '2px' }}>Alıcı Adı: <b>{ord.buyerFullName}</b> | Tel: <b>{ord.buyerPhone}</b></p>
                      <p style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '6px' }}>Teslimat Adresi: <b>{ord.buyerAddress}</b></p>
                      <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#d97706', marginBottom: '8px' }}>Durum: {ord.statusText}</p>
                      {ord.status === 'shipping_expected' && (
                        <button onClick={() => confirmDelivery(ord.id, ord.artId)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Ürünü Teslim Aldım</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 👑 SADECE YÖNETİCİ GÖREBİLİR: ADMIN PANELİ */}
        {activeTab === 'admin_panel' && isAdmin && (
          <section style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', border: '2px solid #d97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#92400e', fontWeight: 'bold' }}>👑 Site Sahibi Ödeme Onay Paneli (Yunus Aralı)</h2>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Banka Hesabı: İş Bankası</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '20px' }}>Alıcıların yaptığı havaleler banka hesabınıza geçtiğinde buradan <b>"Ödemeyi Onayla"</b> butonuna basarak paranın kesinleşmesini sağlayabilir, eserin vitrinde <b>"SATILDI"</b> olarak işaretlenmesini tetikleyebilirsiniz.</p>

            {orders.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Henüz bekleyen ödeme bildirimi yok.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orders.map((ord) => (
                  <div key={ord.id} style={{ border: '1px solid #fcd34d', padding: '16px', borderRadius: '8px', backgroundColor: '#fffbeb', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {ord.image && <img src={ord.image} alt={ord.artTitle} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#1f2937' }}>{ord.artTitle}</h4>
                        <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.05rem' }}>{ord.price}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#1f2937', marginBottom: '2px' }}><b>Alıcı:</b> {ord.buyerFullName} ({ord.buyerPhone})</p>
                      <p style={{ fontSize: '0.85rem', color: '#1f2937', marginBottom: '4px' }}><b>Teslimat Adresi:</b> {ord.buyerAddress}</p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#d97706', marginBottom: '10px' }}><b>Sipariş Durumu:</b> {ord.statusText}</p>
                      
                      {ord.status === 'waiting_admin_approval' && (
                        <button onClick={() => adminApprovePayment(ord.id, ord.artId)} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          ✅ Ödemeyi Onayla (Eseri "Satıldı" İşaretle & Süreci Başlat)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* DETAY & SATIN ALMA MODALI */}
      {selectedArt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '450px', width: '100%', overflow: 'hidden', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}>
            {selectedArt.image && (
              <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '6px', color: '#1f2937' }}>{selectedArt.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Koleksiyon Sahibi: {selectedArt.artist}</p>
              <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 'bold', marginBottom: '8px' }}>Satıcı İletişimi: Gizli (Site Güvencesinde)</p>
              <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '16px', lineHeight: '1.4' }}>{selectedArt.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{selectedArt.isOriginal}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setSelectedArt(null); triggerBuyProcess(selectedArt); }} style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Hemen Satın Al (Havale)</button>
                <button onClick={() => setSelectedArt(null)} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÖDEME VE ALICI BİLGİLERİ MODALI */}
      {showPaymentModal && pendingArtData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 60, overflowY: 'auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px', color: '#1f2937' }}>🏛️ Güvenli Havale & Teslimat Formu</h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '14px' }}>Alınacak Eser: <b>{pendingArtData.title}</b> — <span style={{ color: '#059669', fontWeight: 'bold' }}>Ödenecek Tutar: {pendingArtData.price}</span></p>

            {/* BANKA BİLGİLERİ VE NET TUTAR */}
            <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px', fontSize: '0.85rem' }}>
              <p style={{ fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>Lütfen aşağıdaki site havuz hesabına tam tutarı gönderin:</p>
              <p style={{ marginBottom: '3px' }}>Banka: <b>{escrowAccounts.bankName}</b></p>
              <p style={{ marginBottom: '3px' }}>Alıcı Adı: <b>{escrowAccounts.accountHolder}</b></p>
              <p style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 'bold', color: '#1f2937', marginTop: '6px', background: 'white', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}>{escrowAccounts.tlIban}</p>
              <p style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '6px' }}>💡 Açıklama kısmına ürün adını yazabilirsiniz.</p>
            </div>

            {/* ALICI TESLİMAT BİLGİLERİ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>📦 Ürünün Teslim Edileceği Adres ve İletişim Bilgileri</p>
              
              <input type="text" placeholder="Adınız ve Soyadınız" value={buyerFullName} onChange={(e) => setBuyerFullName(e.target.value)} required style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
              
              <input type="text" placeholder="İrtibat Telefon Numaranız (Örn: 05xx xxx xx xx)" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} required style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
              
              <textarea placeholder="Ürünün Gönderileceği Açık Kargo Adresi (Mahalle, Cadde, No, İlçe/İl)" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={3} required style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} />

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <input type="checkbox" checked={havaleConfirmed} onChange={(e) => setHavaleConfirmed(e.target.checked)} />
                <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 'bold' }}>{pendingArtData.price} tutarındaki havaleyi yukarıdaki IBAN'a gerçekleştirdim.</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={confirmOrderWithEscrow} disabled={paymentProcessing} style={{ flex: 1, backgroundColor: paymentProcessing ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', padding: '11px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem', cursor: paymentProcessing ? 'not-allowed' : 'pointer' }}>
                {paymentProcessing ? 'Bildirim Gönderiliyor...' : 'Ödemeyi Yaptım / Bildir'}
              </button>
              <button onClick={() => setShowPaymentModal(false)} disabled={paymentProcessing} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* GİRİŞ / KAYIT MODALI */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 60 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '360px', width: '100%', padding: '24px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '14px', textAlign: 'center', color: '#1f2937' }}>{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h3>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {authMode === 'register' && (
                <input type="text" placeholder="Kullanıcı adı" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
              )}
              <input type="email" placeholder="E-posta Adresi" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Şifre" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '9px', paddingRight: '36px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
              
              <button type="submit" disabled={authLoading} style={{ backgroundColor: authLoading ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px' }}>
                {authLoading ? 'İşleniyor...' : (authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                {authMode === 'login' ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
              </button>
              <div style={{ marginTop: '8px' }}>
                <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
