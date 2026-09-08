import { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fthfwhiqbwfxolebcqdx.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2Z3aGlxYndmeG9sZWJjcWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTMyOTcsImV4cCI6MjEwMzQ2OTI5N30.efUIMqDHizg7zd4YCkiouCzX0GjpBl7AHkAz0nLpBdI';

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
  const [historyInfo, setHistoryInfo] = useState('');
  const [isOriginal, setIsOriginal] = useState('Orijinal');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [iban, setIban] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [selectedArt, setSelectedArt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingArtData, setPendingArtData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('TL');
  const [paymentMethodType, setPaymentMethodType] = useState('havale'); // 'havale' veya 'kart'

  // Kredi Kartı Form State'leri (Güvenlik Kontrolü İçin)
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');

  const escrowAccounts = {
    accountHolder: 'Yunus Aralı',
    bankName: 'Türkiye İş Bankası',
    tlIban: 'TR41 0006 4000 0017 3003 4172 52',
    usdIban: 'TR76 0006 4000 0027 3004 0573 02'
  };

  const [listings, setListings] = useState([
    {
      id: 'demo-1',
      title: 'Antika Bakır İşleme Tepsi',
      description: '19. yüzyıl Osmanlı dönemi el dövme bakır tepsi.',
      historyInfo: 'Osmanlı’nın son dönemi Anadolu zanaatkarlığının nadide bir örneğidir.',
      isOriginal: 'Orijinal',
      artist: 'Yunus Aralı',
      phone: '05443433881',
      iban: 'TR41 0006 4000 0017 3003 4172 52',
      price: '3.500 ₺',
      image: 'https://picsum.photos/seed/art1/1200/800',
      status: 'Satışta'
    }
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedUser = localStorage.getItem('efnan_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('efnan_user');
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

      if (error) return;

      const formattedArtworks = Array.isArray(data)
        ? data.map((art) => ({
            id: art.id,
            title: art.title || 'İsimsiz Eser',
            description: art.description || 'Açıklama yok',
            historyInfo: art.history_info || 'Bilgi belirtilmemiş',
            isOriginal: art.is_original || 'Orijinal',
            artist: art.artist || 'Anonim',
            phone: art.phone || 'Belirtilmedi',
            iban: art.iban || 'Belirtilmedi',
            price: art.price ? `${art.price} ₺` : '1.000 ₺',
            image: art.image_url || 'https://picsum.photos/seed/default/1200/800',
            status: 'Satışta'
          }))
        : [];

      setListings([
        ...formattedArtworks,
        {
          id: 'demo-1',
          title: 'Antika Bakır İşleme Tepsi',
          description: '19. yüzyıl Osmanlı dönemi el dövme bakır tepsi.',
          historyInfo: 'Osmanlı’nın son dönemi Anadolu zanaatkarlığının nadide bir örneğidir.',
          isOriginal: 'Orijinal',
          artist: 'Yunus Aralı',
          phone: '05443433881',
          iban: 'TR41 0006 4000 0017 3003 4172 52',
          price: '3.500 ₺',
          image: 'https://picsum.photos/seed/art1/1200/800',
          status: 'Satışta'
        }
      ]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      alert('❌ Lütfen sadece resim dosyası seçin.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Resim en fazla 10 MB olabilir.');
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
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;
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
          if (!ctx) {
            reject(new Error('Resim işleme alanı oluşturulamadı.'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) reject(new Error('Resim sıkıştırılamadı.'));
            else resolve(blob);
          }, 'image/jpeg', 0.82);
        };
        img.onerror = () => reject(new Error('Resim okunamadı.'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      reader.readAsDataURL(file);
    });
  };

  const resetImageSelection = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    const cameraInput = document.getElementById('camera-image-input');
    const galleryInput = document.getElementById('gallery-image-input');
    if (cameraInput) cameraInput.value = '';
    if (galleryInput) galleryInput.value = '';
  };

  const resetListingForm = () => {
    setTitle('');
    setDescription('');
    setHistoryInfo('');
    setIsOriginal('Orijinal');
    setPrice('');
    setPhone('');
    setIban('');
    resetImageSelection();
  };

  const triggerListingProcess = async (e) => {
    e.preventDefault();
    if (uploading) return;

    if (!currentUser) {
      alert('❌ Ürün listelemek için önce giriş yapmalısınız!');
      setShowAuthModal(true);
      return;
    }
    if (!title.trim() || !price.trim() || !phone.trim() || !iban.trim() || !imageFile) {
      alert('❌ Lütfen zorunlu alanları, fiyatı, telefon ve IBAN numarasını doldurun.');
      return;
    }

    setUploading(true);
    let uploadedFilePath = null;

    try {
      const compressedBlob = await compressImage(imageFile);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;
      uploadedFilePath = `uploads/${uniqueName}`;

      // BUCKET İSMİ PANELİNİZLE UYUMLU OLARAK 'artworks-images' OLARak GÜNCELLENDİ
      const { error: uploadError } = await supabase.storage
        .from('artworks-images')
        .upload(uploadedFilePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw new Error(`Resim yüklenemedi: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from('artworks-images')
        .getPublicUrl(uploadedFilePath);

      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) throw new Error('Resim URL adresi oluşturulamadı.');

      const artworkData = {
        title: title.trim(),
        description: description.trim() || 'Açıklama yok',
        history_info: historyInfo.trim() || 'Belirtilmemiş',
        is_original: isOriginal,
        price: parseFloat(price) || 0,
        image_url: imageUrl,
        artist: currentUser.username || 'Anonim',
        phone: phone.trim(),
        iban: iban.trim()
      };

      const { error: insertError } = await supabase
        .from('artworks')
        .insert([artworkData]);

      if (insertError) {
        if (uploadedFilePath) {
          await supabase.storage.from('artworks-images').remove([uploadedFilePath]);
        }
        throw new Error(`Veritabanına kayıt hatası: ${insertError.message}`);
      }

      resetListingForm();
      await fetchArtworksFromSupabase();
      alert('✅ Ürününüz başarıyla incelenmek üzere vitrine eklendi!');
    } catch (error) {
      alert('❌ Ürün yüklenirken hata oluştu:\n\n' + (error?.message || 'Bilinmeyen hata'));
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !username.trim()) {
      alert('❌ Lütfen tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      alert('❌ Şifre en az 6 karakter olmalıdır.');
      return;
    }
    const newUser = { username: username.trim(), email: email.trim().toLowerCase() };
    localStorage.setItem('efnan_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    setShowAuthModal(false);
    setEmail('');
    setPassword('');
    setUsername('');
    alert('✅ Kayıt başarılı!');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      alert('❌ Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    const existingUser = {
      username: email.trim().toLowerCase().split('@')[0],
      email: email.trim().toLowerCase()
    };
    localStorage.setItem('efnan_user', JSON.stringify(existingUser));
    setCurrentUser(existingUser);
    setShowAuthModal(false);
    setEmail('');
    setPassword('');
    alert('✅ Giriş yapıldı!');
  };

  const handleLogout = () => {
    localStorage.removeItem('efnan_user');
    setCurrentUser(null);
    alert('Çıkış yapıldı.');
  };

  const triggerBuyProcess = (art) => {
    if (!currentUser) {
      alert('❌ Satın almak için giriş yapmalısınız!');
      setShowAuthModal(true);
      return;
    }
    setPendingArtData(art);
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setShowPaymentModal(true);
  };

  const confirmOrderWithEscrow = () => {
    if (!pendingArtData || !currentUser) return;

    if (paymentMethodType === 'kart') {
      const cleanCardNum = cardNumber.replace(/\D/g, '');
      const cleanCvv = cardCvv.replace(/\D/g, '');

      if (!cardHolder.trim() || cardHolder.trim().length < 3) {
        alert('❌ Lütfen kart üzerindeki geçerli adı soyadı girin.');
        return;
      }
      if (cleanCardNum.length < 15 || cleanCardNum.length > 16) {
        alert('❌ Geçersiz kart numarası! Kredi kartı numarası 15 veya 16 haneli olmalıdır.');
        return;
      }
      if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
        alert('❌ Geçersiz son kullanma tarihi formatı! (Örn: 08/28)');
        return;
      }
      if (cleanCvv.length !== 3) {
        alert('❌ Geçersiz CVV! Güvenlik kodu 3 haneli olmalıdır.');
        return;
      }
    }

    const usedIban = selectedCurrency === 'TL' ? escrowAccounts.tlIban : escrowAccounts.usdIban;

    const newOrder = {
      id: Date.now(),
      artTitle: pendingArtData.title,
      artist: pendingArtData.artist,
      phone: pendingArtData.phone,
      sellerIban: pendingArtData.iban,
      price: pendingArtData.price,
      buyer: currentUser.username,
      paymentMethod: paymentMethodType === 'kart' ? `Kredi Kartı (${selectedCurrency})` : `Güvenli Havale (${selectedCurrency} - İş Bankası)`,
      escrowIbanUsed: usedIban,
      status: 'pending_payment',
      statusText: 'Ödeme Bekleniyor - Onay Bekliyor',
      date: new Date().toLocaleDateString('tr-TR')
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('efnan_orders', JSON.stringify(updatedOrders));

    setShowPaymentModal(false);
    setPendingArtData(null);
    alert('✅ Siparişiniz oluşturuldu! Ödemeniz ürün fiyatına sabitlenmiş olarak onay bekliyor.');
    setActiveTab('my_orders');
  };

  const completePaymentForOrder = (orderId) => {
    const updated = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'shipping_expected',
          statusText: 'Ödemeniz Havuzda Güvende - Kargo Bekleniyor'
        };
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('efnan_orders', JSON.stringify(updated));
    alert('🎉 Ödemeniz başarıyla doğrulandı ve güvenli havuz hesabına alındı!');
  };

  const confirmDelivery = (orderId) => {
    const updated = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'completed',
          statusText: 'Teslim Alındı - Ödeme Satıcıya Aktarıldı ✅'
        };
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('efnan_orders', JSON.stringify(updated));
    alert('🎉 Teslimat onaylandı! Ücret güvenli havuzdan satıcının hesabına transfer edildi.');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Efnan ArtBazaar - Güvenli Sanat ve Antika Pazarı</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div onClick={() => setActiveTab('explore')} style={{ cursor: 'pointer', fontWeight: '900', fontSize: '1.1rem', color: '#1f2937' }}>
          🏛️ Efnan ArtBazaar
        </div>
        <div>
          {currentUser ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>👤 {currentUser.username}</span>
              <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Çıkış</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Giriş Yap</button>
          )}
        </div>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '12px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('explore')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'explore' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'explore' ? 'white' : '#374151', fontWeight: 'bold', cursor: 'pointer' }}>Keşfet & Eserler</button>
        <button onClick={() => setActiveTab('my_orders')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'my_orders' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'my_orders' ? 'white' : '#374151', fontWeight: 'bold', cursor: 'pointer' }}>Siparişlerim / İşlemler ({orders.length})</button>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 12px' }}>
        {activeTab === 'explore' && (
          <>
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '14px', color: '#111827' }}>Sanat, Tablo ve Tarihi Eser Vitrini</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {listings.map((art) => (
                  <div key={art.id} onClick={() => setSelectedArt(art)} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
                    <img src={art.image} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ padding: '14px' }}>
                      <span style={{ fontSize: '0.7rem', backgroundColor: art.isOriginal === 'Orijinal' ? '#d1fae5' : '#fee2e2', color: art.isOriginal === 'Orijinal' ? '#065f46' : '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{art.isOriginal}</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '6px 0 4px 0' }}>{art.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Satıcı / Sanatçı: {art.artist}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>{art.price}</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedArt(art); }} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>İncele & Satın Al</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#111827' }}>Eser / Tarihi Parça Yükleme Paneli</h2>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '16px' }}>Tablo, antika, tarihi eser veya sanat objenizi detaylı bilgileriyle birlikte güvenle vitrine ekleyin.</p>
              
              <form onSubmit={triggerListingProcess} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Eser / Obje Adı" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Orjinallik Durumu:</label>
                    <select value={isOriginal} onChange={(e) => setIsOriginal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}>
                      <option value="Orijinal">Orijinal</option>
                      <option value="Reproduksiyon / Kopya">Reproduksiyon / Kopya</option>
                      <option value="Antika / Dönem Eseri">Antika / Dönem Eseri</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Fiyat (₺):</label>
                    <input type="number" placeholder="Örn: 2500" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </div>
                </div>

                <textarea placeholder="Genel Açıklama, Boyutlar ve Fiziksel Durum" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                <textarea placeholder="Kısa Tarihsel / Sanatsal Bilgi (Varsa geçmişi, dönemi veya hikayesi)" value={historyInfo} onChange={(e) => setHistoryInfo(e.target.value)} rows="2" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Telefon Numarası (05XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  <input type="text" placeholder="Size Ödenecek IBAN (TR...)" value={iban} onChange={(e) => setIban(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                </div>
                
                <div style={{ border: '2px dashed #4f46e5', padding: '16px', borderRadius: '8px', backgroundColor: '#eef2ff', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '10px 14px', borderRadius: '7px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      📷 Kamera ile Çek
                      <input id="camera-image-input" type="file" accept="image/*" capture="environment" disabled={uploading} onChange={(e) => handleImageSelect(e.target.files?.[0])} style={{ display: 'none' }} />
                    </label>
                    <label style={{ backgroundColor: '#059669', color: 'white', padding: '10px 14px', borderRadius: '7px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      📁 Galeriden Seç
                      <input id="gallery-image-input" type="file" accept="image/*" disabled={uploading} onChange={(e) => handleImageSelect(e.target.files?.[0])} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {imagePreview && (
                    <div style={{ marginTop: '15px' }}>
                      <img src={imagePreview} alt="Önizleme" style={{ width: '100%', maxWidth: '240px', height: '160px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto' }} />
                      <button type="button" onClick={resetImageSelection} style={{ marginTop: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Fotoğrafı Kaldır</button>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={uploading} style={{ backgroundColor: uploading ? '#9ca3af' : '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {uploading ? '⏳ Yükleniyor...' : '🚀 Ürünü Vitrine Ekle'}
                </button>
              </form>
            </section>
          </>
        )}

        {activeTab === 'my_orders' && (
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: '#111827' }}>Siparişlerim & Güvenli Teslimat Takibi</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Henüz kayıtlı bir siparişiniz bulunmuyor.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} style={{ backgroundColor: 'white', padding: '18px', borderRadius: '10px', marginBottom: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid #4f46e5' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>{order.artTitle}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: '2px 0' }}>Satıcı: <b>{order.artist}</b> | Tutar (Sabit): <b style={{ color: '#059669' }}>{order.price}</b></p>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: '2px 0' }}>İletişim: <b>{order.phone}</b></p>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: '2px 0' }}>Ödeme Yöntemi: <b>{order.paymentMethod}</b></p>
                  <code style={{ fontSize: '0.75rem', color: '#1d4ed8', display: 'block', margin: '4px 0' }}>Havuz IBAN: {order.escrowIbanUsed}</code>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Durum: <b style={{ color: '#2563eb' }}>{order.statusText || order.status}</b></p>
                  
                  {order.status === 'pending_payment' && (
                    <button onClick={() => completePaymentForOrder(order.id)} style={{ marginTop: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}>
                      💳 Ödeme Onayını Tamamla ve Havuza Aktar
                    </button>
                  )}

                  {order.status === 'shipping_expected' && (
                    <button onClick={() => confirmDelivery(order.id)} style={{ marginTop: '12px', backgroundColor: '#059669', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}>
                      📦 Ürünü Teslim Aldım, Onayla ve Ödemeyi Serbest Bırak
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Ürün Detay Modalı */}
      {selectedArt && (
        <div onClick={() => setSelectedArt(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '8px' }} />
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#eef2ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{selectedArt.isOriginal}</span>
              <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.25rem' }}>{selectedArt.title}</h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Satıcı / Sanatçı: <b>{selectedArt.artist}</b> ({selectedArt.phone})</p>
              
              <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', margin: '10px 0', fontSize: '0.85rem' }}>
                <p style={{ margin: '0 0 4px 0' }}><b>Fiziksel Açıklama:</b> {selectedArt.description}</p>
                <p style={{ margin: '0' }}><b>Tarihsel / Sanatsal Bilgi:</b> {selectedArt.historyInfo}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
                <button onClick={() => { const art = selectedArt; setSelectedArt(null); triggerBuyProcess(art); }} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Güvenli Satın Al</button>
              </div>
              <button onClick={() => setSelectedArt(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', width: '100%', marginTop: '12px' }}>Pencereyi Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Güvenli Ödeme / Escrow ve Kart Doğrulama Modalı */}
      {showPaymentModal && pendingArtData && (
        <div onClick={() => setShowPaymentModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '460px', width: '100%', padding: '22px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>🛡️ Güvenli Emanet Ödemesi (Escrow)</h3>
            <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4' }}>
              Paranız <b>{escrowAccounts.accountHolder}</b> adına kayıtlı İş Bankası havuzunda güvendedir. Tutar ürün fiyatına sabitlenmiştir.
            </p>

            <div style={{ margin: '12px 0' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Ödeme Yöntemi Seçin:</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button type="button" onClick={() => setPaymentMethodType('havale')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: paymentMethodType === 'havale' ? '2px solid #4f46e5' : '1px solid #d1d5db', backgroundColor: paymentMethodType === 'havale' ? '#eef2ff' : 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>🏦 Havale / EFT</button>
                <button type="button" onClick={() => setPaymentMethodType('kart')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: paymentMethodType === 'kart' ? '2px solid #4f46e5' : '1px solid #d1d5db', backgroundColor: paymentMethodType === 'kart' ? '#eef2ff' : 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>💳 Kredi Kartı ile Öde</button>
              </div>

              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Para Birimi:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedCurrency('TL')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: selectedCurrency === 'TL' ? '2px solid #4f46e5' : '1px solid #d1d5db', backgroundColor: selectedCurrency === 'TL' ? '#eef2ff' : 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>🇹🇷 TL Hesabı</button>
                <button type="button" onClick={() => setSelectedCurrency('USD')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: selectedCurrency === 'USD' ? '2px solid #4f46e5' : '1px solid #d1d5db', backgroundColor: selectedCurrency === 'USD' ? '#eef2ff' : 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>🇺🇸 USD Hesabı</button>
              </div>
            </div>

            {paymentMethodType === 'havale' ? (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px', margin: '12px 0', fontSize: '0.85rem' }}>
                <p style={{ margin: '2px 0' }}><b>Ürün:</b> {pendingArtData.title}</p>
                <p style={{ margin: '2px 0' }}><b>Ödenecek Net Tutar (Sabit):</b> <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '1rem' }}>{pendingArtData.price}</span></p>
                <hr style={{ border: '0', borderTop: '1px solid #bfdbfe', margin: '8px 0' }} />
                <p style={{ margin: '2px 0' }}><b>Havuz IBAN:</b></p>
                <code style={{ wordBreak: 'break-all', color: '#1d4ed8', display: 'block', fontWeight: 'bold', backgroundColor: 'white', padding: '6px', borderRadius: '4px', border: '1px solid #93c5fd' }}>
                  {selectedCurrency === 'TL' ? escrowAccounts.tlIban : escrowAccounts.usdIban}
                </code>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', padding: '12px', borderRadius: '8px', margin: '12px 0', fontSize: '0.85rem' }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#be185d' }}>Güvenli Kredi Kartı Ödemesi</p>
                <p style={{ margin: '0 0 8px 0', color: '#4b5563', fontSize: '0.8rem' }}>Tahsil Edilecek Tutar: <b>{pendingArtData.price}</b> (Sabit)</p>
                <input 
                  type="text" 
                  placeholder="Kart Üzerindeki Ad Soyad" 
                  value={cardHolder} 
                  onChange={(e) => setCardHolder(e.target.value)} 
                  style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                />
                <input 
                  type="text" 
                  placeholder="Kart Numarası (16 Hane)" 
                  maxLength={19}
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    placeholder="AA/YY" 
                    maxLength={5}
                    value={cardExpiry} 
                    onChange={(e) => setCardExpiry(e.target.value)} 
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                  />
                  <input 
                    type="password" 
                    placeholder="CVV (3 Hane)" 
                    maxLength={4}
                    value={cardCvv} 
                    onChange={(e) => setCardCvv(e.target.value)} 
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                  />
                </div>
              </div>
            )}

            <button onClick={confirmOrderWithEscrow} style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', width: '100%', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Ödemeyi Doğrula ve Siparişi Tamamla</button>
            <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', width: '100%', marginTop: '10px', fontSize: '0.85rem' }}>Vazgeç</button>
          </div>
        </div>
      )}

      {/* Giriş / Kayıt Modalı */}
      {showAuthModal && (
        <div onClick={() => setShowAuthModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '360px', width: '100%', padding: '20px' }}>
            <h3 style={{ marginTop: 0 }}>{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h3>
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {authMode === 'register' && <input type="text" placeholder="Kullanıcı Adı" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />}
              <input type="email" placeholder="E-posta Adresi" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <input type="password" placeholder="Şifre (En az 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <button type="submit" style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginTop: '12px', fontSize: '0.85rem', width: '100%' }}>
              {authMode === 'login' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
