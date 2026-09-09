import { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fthfwhiqbwfxolebcqdx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_trENam4_68oLVYYmUNjp-Q_1DNd95Xo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const [selectedArt, setSelectedArt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingArtData, setPendingArtData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('TL');
  const [paymentMethodType, setPaymentMethodType] = useState('havale');

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
      title: 'Osmanlı El Dövme Bakır İbrik',
      description: '19. yüzyıl el işçiliği kabartma motifli antika bakır ibrik. Koleksiyonluk nadide parça.',
      isOriginal: 'Orijinal',
      artist: 'Koleksiyoner Yunus',
      phone: '05443433881',
      iban: 'TR41 0006 4000 0017 3003 4172 52',
      price: '4.500 ₺',
      image: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc873?auto=format&fit=crop&w=1200&q=80',
      status: 'Satışta'
    },
    {
      id: 'demo-2',
      title: 'Antika Pirinç Mumluk Şamdan Çifti',
      description: 'Fransız dönemi ağır pirinç döküm orijinal antika şamdan seti. Kusursuz kondisyonda.',
      isOriginal: 'Orijinal',
      artist: 'Ahmet Antika',
      phone: '05332221100',
      iban: 'TR41 0006 4000 0017 3003 4172 52',
      price: '6.200 ₺',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
      status: 'Satışta'
    },
    {
      id: 'demo-3',
      title: '18. Yüzyıl Antika Ahşap Oyma Sehpa',
      description: 'Geleneksel el oyması nadir koleksiyon parça. El işçiliği zarif detaylar.',
      isOriginal: 'Orijinal',
      artist: 'Sanat Galerisi',
      phone: '05554443322',
      iban: 'TR41 0006 4000 0017 3003 4172 52',
      price: '14.500 ₺',
      image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=80',
      status: 'Satışta'
    }
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email.split('@')[0],
          email: session.user.email
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email.split('@')[0],
          email: session.user.email
        });
      } else {
        setCurrentUser(null);
      }
    });

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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchArtworksFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase veri çekme hatası:', error.message);
        return;
      }

      const formattedArtworks = Array.isArray(data)
        ? data.map((art) => ({
            id: art.id,
            title: art.title || 'İsimsiz Eser',
            description: art.description || 'Açıklama yok',
            isOriginal: art.is_original || 'Orijinal',
            artist: art.artist || 'Anonim',
            phone: art.phone || 'Gizli',
            iban: art.iban || 'Gizli',
            price: art.price ? `${art.price} ₺` : '1.000 ₺',
            image: art.image_url || 'https://images.unsplash.com/photo-1594897030264-ab7d87efc873?auto=format&fit=crop&w=1200&q=80',
            status: 'Satışta'
          }))
        : [];

      setListings([
        ...formattedArtworks,
        {
          id: 'demo-1',
          title: 'Osmanlı El Dövme Bakır İbrik',
          description: '19. yüzyıl el işçiliği kabartma motifli antika bakır ibrik. Koleksiyonluk nadide parça.',
          isOriginal: 'Orijinal',
          artist: 'Koleksiyoner Yunus',
          phone: '05443433881',
          iban: 'TR41 0006 4000 0017 3003 4172 52',
          price: '4.500 ₺',
          image: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc873?auto=format&fit=crop&w=1200&q=80',
          status: 'Satışta'
        },
        {
          id: 'demo-2',
          title: 'Antika Pirinç Mumluk Şamdan Çifti',
          description: 'Fransız dönemi ağır pirinç döküm orijinal antika şamdan seti. Kusursuz kondisyonda.',
          isOriginal: 'Orijinal',
          artist: 'Ahmet Antika',
          phone: '05332221100',
          iban: 'TR41 0006 4000 0017 3003 4172 52',
          price: '6.200 ₺',
          image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
          status: 'Satışta'
        },
        {
          id: 'demo-3',
          title: '18. Yüzyıl Antika Ahşap Oyma Sehpa',
          description: 'Geleneksel el oyması nadir koleksiyon parça. El işçiliği zarif detaylar.',
          isOriginal: 'Orijinal',
          artist: 'Sanat Galerisi',
          phone: '05554443322',
          iban: 'TR41 0006 4000 0017 3003 4172 52',
          price: '14.500 ₺',
          image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=80',
          status: 'Satışta'
        }
      ]);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
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

    try {
      const compressedBlob = await compressImage(imageFile);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;
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
        const errText = await response.text();
        throw new Error(`Resim yüklenemedi (${response.status}): ${errText}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('artworks-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) throw new Error('Resim URL adresi oluşturulamadı.');

      const artworkData = {
        title: title.trim(),
        description: description.trim() || 'Açıklama yok',
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
        throw new Error(`Veritabanına kayıt hatası: ${insertError.message}`);
      }

      resetListingForm();
      await fetchArtworksFromSupabase();
      alert('✅ Eseriniz güvenli vitrine başarıyla eklendi!');
    } catch (error) {
      alert('❌ Ürün yüklenirken hata oluştu:\n\n' + (error?.message || 'Bilinmeyen hata'));
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !username.trim()) {
      alert('❌ Lütfen tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      alert('❌ Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { username: username.trim() }
        }
      });

      if (error) throw error;

      alert('✅ Kayıt başarılı! Oturum açıldı.');
      if (data?.user) {
        setCurrentUser({
          id: data.user.id,
          username: username.trim(),
          email: email.trim()
        });
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        setUsername('');
      } else {
        setAuthMode('login');
      }
    } catch (error) {
      alert('❌ Kayıt olurken hata oluştu: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      alert('❌ Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw new Error('E-posta veya şifre hatalı!');
      }

      if (data?.user) {
        const uname = data.user.user_metadata?.username || email.trim().split('@')[0];
        setCurrentUser({
          id: data.user.id,
          username: uname,
          email: data.user.email
        });
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        alert('✅ Giriş başarılı!');
      }
    } catch (error) {
      alert('❌ Giriş başarısız: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        alert('❌ Geçersiz kart numarası! 15 veya 16 haneli olmalıdır.');
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
      phone: pendingArtData.phone || 'Gizli (Site Güvencesinde)',
      sellerIban: pendingArtData.iban || 'Gizli (Site Havuzunda)',
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
    alert('✅ Siparişiniz oluşturuldu! Ödemeniz güvenceye alındı.');
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
    alert('🎉 Ödemeniz doğrulandı ve güvenli havuz hesabına aktarıldı!');
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
        <div onClick={() => window.location.reload()} style={{ cursor: 'pointer', fontWeight: '900', fontSize: '1.1rem', color: '#1f2937' }}>
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
            {/* ŞIK KARŞILAMA / HERO BÖLÜMÜ */}
            <section style={{ backgroundColor: '#1f2937', color: 'white', padding: '32px 20px', borderRadius: '12px', marginBottom: '30px', textAlign: 'center', backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '10px' }}>Efnan ArtBazaar'a Hoş Geldiniz</h1>
              <p style={{ fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 16px auto', color: '#d1d5db' }}>Değerli antikalar, eşsiz tablolar ve orijinal sanat eserleri tamamen güvenli havuz sistemiyle koruma altında.</p>
              <button onClick={() => { window.scrollTo({ top: 500, behavior: 'smooth' }); }} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}>Vitrinleri Keşfet</button>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '14px', color: '#111827' }}>Sanat, Tablo ve Antika Vitrini</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {listings.map((art) => (
                  <div key={art.id} onClick={() => setSelectedArt(art)} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
                    <img src={art.image} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ padding: '14px' }}>
                      <span style={{ fontSize: '0.7rem', backgroundColor: art.isOriginal === 'Orijinal' ? '#d1fae5' : '#fee2e2', color: art.isOriginal === 'Orijinal' ? '#065f46' : '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{art.isOriginal}</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '6px 0 4px 0' }}>{art.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Sanatçı / Sahip: {art.artist}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>{art.price}</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedArt(art); }} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Detay & Güvenli Al</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#111827' }}>Eser / Tarihi Parça Yükleme Paneli</h2>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '16px' }}>Telefon ve IBAN bilgileriniz sadece site yöneticisinde güvende kalır; alıcılar doğrudan göremez ve sizinle iletişime geçemez (Alım-satım site üzerinden yürütülür).</p>
              
              <form onSubmit={triggerListingProcess} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Eser / Obje Adı" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Orjinallik Durumu:</label>
                    <select value={isOriginal} onChange={(e) => setIsOriginal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}>
                      <option value="Orijinal">Orijinal</option>
                      <option value="Reproduksiyon / Kopya">Reproduksiyon / Kopya</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Fiyat (₺):</label>
                    <input type="number" placeholder="Örn: 3500" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  </div>
                </div>

                <textarea placeholder="Eser Açıklaması ve Detayları" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Size Ulaşacak Tel (Alıcı Göremez)" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  <input type="text" placeholder="Ödeme Alınacak IBAN (Alıcı Göremez)" value={iban} onChange={(e) => setIban(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                </div>

                <div style={{ border: '2px dashed #d1d5db', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Önizleme" style={{ maxWidth: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />
                      <div>
                        <button type="button" onClick={resetImageSelection} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Resmi Değiştir / Kaldır</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0 }}>Eser Fotoğrafı Ekle</p>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <label style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                          📸 Kameradan Çek
                          <input id="camera-image-input" type="file" accept="image/*" capture="environment" onChange={(e) => handleImageSelect(e.target.files[0])} style={{ display: 'none' }} />
                        </label>
                        <label style={{ backgroundColor: '#059669', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                          📁 Galeriden Seç
                          <input id="gallery-image-input" type="file" accept="image/*" onChange={(e) => handleImageSelect(e.target.files[0])} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={uploading} style={{ backgroundColor: uploading ? '#9ca3af' : '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  {uploading ? 'Yükleniyor ve Kaydediliyor...' : 'Eseri Vitrine Ekle'}
                </button>
              </form>
            </section>
          </>
        )}

        {activeTab === 'my_orders' && (
          <section style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#111827' }}>Siparişlerim ve Güvenli Havuz İşlemleri</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Henüz oluşturulmuş bir siparişiniz bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orders.map((ord) => (
                  <div key={ord.id} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ fontWeight: 'bold', fontSize: '1rem' }}>{ord.artTitle}</h4>
                      <span style={{ fontWeight: 'bold', color: '#059669' }}>{ord.price}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Satıcı İletişimi: <b>Gizli Tutuldu (Site Güvencesinde)</b></p>
                    <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '4px' }}>Ödeme Yöntemi: {ord.paymentMethod}</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#d97706', marginBottom: '12px' }}>Durum: {ord.statusText}</p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ord.status === 'pending_payment' && (
                        <button onClick={() => completePaymentForOrder(ord.id)} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Ödemeyi Onayla & Havuza Aktar</button>
                      )}
                      {ord.status === 'shipping_expected' && (
                        <button onClick={() => confirmDelivery(ord.id)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Ürünü Teslim Aldım (Satıcıya Ödeme Çöz)</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {selectedArt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%', overflow: 'hidden', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}>
            <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>{selectedArt.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Sanatçı / Sahip: {selectedArt.artist}</p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>İletişim Bilgisi: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Gizli (Site Aracı)</span></p>
              <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '12px' }}>Açıklama: {selectedArt.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
                <span style={{ fontSize: '0.8rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{selectedArt.isOriginal}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setSelectedArt(null); triggerBuyProcess(selectedArt); }} style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Güvenli Satın Al</button>
                <button onClick={() => setSelectedArt(null)} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '12px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && pendingArtData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 60 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '24px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>Güvenli Ödeme / Havuz Sistemi</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '16px' }}>Ödemeniz siz ürünü teslim alıp onaylayana kadar güvenli havuz hesabında tutulur. Satıcıyla iletişim kurulmaz, tüm süreç site garantisindedir.</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Ödeme Yöntemi:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setPaymentMethodType('havale')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: paymentMethodType === 'havale' ? '2px solid #4f46e5' : '1px solid #d1d5db', backgroundColor: paymentMethodType === 'havale' ? '#eef2ff' : 'white', fontWeight: 'bold', cursor: 'pointer' }}>Güvenli Havale</button>
                <button type="button" onClick={() => setPaymentMethodType('kart')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: paymentMethodType === 'kart' ? '2px solid #4f46e5' : '1px solid #d1d5db', backgroundColor: paymentMethodType === 'kart' ? '#eef2ff' : 'white', fontWeight: 'bold', cursor: 'pointer' }}>Kredi Kartı</button>
              </div>
            </div>

            {paymentMethodType === 'kart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <input type="text" placeholder="Kart Üzerindeki İsim Soyisim" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                <input type="text" placeholder="Kart Numarası (16 Hane)" maxLength={16} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="AA/YY" maxLength={5} value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  <input type="text" placeholder="CVV" maxLength={3} value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                </div>
              </div>
            )}

            {paymentMethodType === 'havale' && (
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px', fontSize: '0.85rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Havuz IBAN ({escrowAccounts.bankName}):</p>
                <p style={{ fontFamily: 'monospace', color: '#1f2937' }}>{escrowAccounts.tlIban}</p>
                <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px' }}>Alıcı: {escrowAccounts.accountHolder}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={confirmOrderWithEscrow} style={{ flex: 1, backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Siparişi Tamamla</button>
              <button onClick={() => setShowPaymentModal(false)} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 60 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '380px', width: '100%', padding: '24px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h3>
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authMode === 'register' && (
                <input type="text" placeholder="Kullanıcı Adı" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              )}
              <input type="email" placeholder="E-posta Adresi" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              <input type="password" placeholder="Şifre (En az 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
              
              <button type="submit" disabled={authLoading} style={{ backgroundColor: authLoading ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: authLoading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
                {authLoading ? 'İşleniyor...' : (authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
                {authMode === 'login' ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
              </button>
              <div style={{ marginTop: '8px' }}>
                <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer' }}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
