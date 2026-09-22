import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fthfwhiqbwfxolebcqdx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_trENam4_68oLVYYmUNjp-Q_1DNd95Xo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 👑 Site Sahibi / Yönetici E-posta Adresi
const ADMIN_EMAIL = 'beyef.alfa@gmail.com';
const COMMISSION_RATE = 0.10; // %10 Site Komisyonu

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

  // Düzenleme Modali State'leri
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArt, setEditingArt] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editIsOriginal, setEditIsOriginal] = useState('Orijinal');
  const [editLoading, setEditLoading] = useState(false);

  // Alıcı Teslimat, Ödeme Yöntemi ve Dekont Bilgileri
  const [buyerFullName, setBuyerFullName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [paymentType, setPaymentType] = useState('bank'); // 'bank', 'usdt', 'btc'
  const [bankReceiptNo, setBankReceiptNo] = useState(''); 
  const [havaleConfirmed, setHavaleConfirmed] = useState(false);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');

  const escrowAccounts = {
    bankName: 'Türkiye İş Bankası',
    tlIban: 'TR41 0006 4000 0017 3003 4172 52',
    accountHolder: 'Yunus Aralı',
    cryptoNetwork: 'BSC (BNB Smart Chain / BEP20)',
    usdtWallet: '0x226391d8dbe7f003f907c8b55bc19793c4c12700',
    btcWallet: '0x226391d8dbe7f003f907c8b55bc19793c4c12700'
  };

  const [listings, setListings] = useState([]);

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
        status: art.status || 'Satışta'
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

  const handleDeleteMyListing = async (artId) => {
    if (!confirm('❌ Bu eseri satıştan kaldırmak istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artId);

      if (error) {
        alert('❌ Silme sırasında hata oluştu: ' + error.message);
        return;
      }

      setSelectedArt(null);
      await fetchArtworksFromSupabase();
      alert('✅ Eser vitrinden başarıyla kaldırıldı.');
    } catch (err) {
      alert('❌ İşlem başarısız.');
    }
  };

  const openEditModal = (art) => {
    setEditingArt(art);
    setEditTitle(art.title);
    setEditDescription(art.description);
    setEditPrice(art.rawPrice ? art.rawPrice.toString() : '');
    setEditIsOriginal(art.isOriginal || 'Orijinal');
    setSelectedArt(null);
    setShowEditModal(true);
  };

  const handleUpdateArtwork = async (e) => {
    e.preventDefault();
    if (!editingArt) return;
    if (!editTitle.trim() || !editPrice.trim()) {
      alert('❌ Başlık ve fiyat alanları boş bırakılamaz.');
      return;
    }

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('artworks')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim(),
          price: parseFloat(editPrice) || 0,
          is_original: editIsOriginal
        })
        .eq('id', editingArt.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingArt(null);
      await fetchArtworksFromSupabase();
      alert('✅ Eser bilgileri başarıyla güncellendi!');
    } catch (err) {
      alert('❌ Güncelleme hatası: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleShareArtwork = (art) => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.href.split('?')[0];
    const shareText = `🏛️ Efnan Antika & Sanat Vitrini\n\n🔍 Eser: ${art.title}\n💰 Fiyat: ${art.price}\n📜 Durum: ${art.isOriginal}\n\nBu eşsiz tarihi eseri buradan inceleyip güvenle satın alabilirsin:\n👉 ${currentUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      alert('✅ Ürün paylaşım metni ve site adresi panoya kopyalandı! İstediğiniz kişiye (WhatsApp, Mesaj vb.) yapıştırıp gönderebilirsiniz.');
    } else {
      prompt('Paylaşım Bağlantısı ve Metni:', shareText);
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

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: { data: { username: username.trim() } }
        });

        if (error) throw error;

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) throw error;

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
      alert('❌ Giriş başarısız: ' + (err.message || 'E-posta veya şifre hatalı.'));
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
    if (!currentUser) {
      alert('❌ Satın alma işlemi yapmak için önce giriş yapmalısınız!');
      setShowAuthModal(true);
      return;
    }

    setPendingArtData(art);
    setBuyerFullName('');
    setBuyerPhone('');
    setBuyerAddress('');
    setPaymentType('bank');
    setBankReceiptNo('');
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
    if (!bankReceiptNo.trim()) {
      alert('❌ Lütfen işlem dekont numarasını, referans kodunu veya kripto transfer Hash değerini giriniz.');
      return;
    }
    if (!havaleConfirmed) {
      alert('❌ Lütfen ödemeyi gerçekleştirdiğinizi onaylamak için kutucuğu işaretleyin.');
      return;
    }

    setPaymentProcessing(true);

    setTimeout(() => {
      const rawP = pendingArtData.rawPrice || 1000;
      const commissionAmount = rawP * COMMISSION_RATE;
      const sellerPayout = rawP - commissionAmount;

      const paymentMethodName = 
        paymentType === 'usdt' ? 'USDT (BEP20)' :
        paymentType === 'btc' ? 'Bitcoin (BTC / BEP20)' : 
        'Güvenli Havale / EFT (İş Bankası)';

      const newOrder = {
        id: Date.now(),
        artTitle: pendingArtData.title,
        artId: pendingArtData.id,
        artist: pendingArtData.artist,
        sellerIban: pendingArtData.iban, 
        price: pendingArtData.price,
        rawPrice: rawP,
        commission: commissionAmount,
        sellerPayout: sellerPayout,
        image: pendingArtData.image,
        buyerFullName: buyerFullName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerAddress: buyerAddress.trim(),
        bankReceiptNo: bankReceiptNo.trim(),
        paymentMethod: paymentMethodName,
        status: 'waiting_admin_approval',
        statusText: 'Ödeme ve Dekont/Hash Bildirildi — Site Sahibi Onayı Bekleniyor ⏳',
        date: new Date().toLocaleDateString('tr-TR')
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('efnan_orders', JSON.stringify(updatedOrders));

      setPaymentProcessing(false);
      setShowPaymentModal(false);
      setPendingArtData(null);

      alert(`✅ Ödeme bildiriminiz başarıyla iletildi!\n\nSite sahibi cüzdan/banka hesabını kontrol edip ödemenizi onayladığında kargonuz hazırlanacaktır.`);
      setActiveTab('my_orders');
    }, 1200);
  };

  const adminApprovePayment = async (orderId, artId) => {
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

    try {
      await supabase
        .from('artworks')
        .update({ status: 'Satıldı' })
        .eq('id', artId);

      await fetchArtworksFromSupabase();
    } catch (e) {
      console.error(e);
    }

    alert('👑 Ödeme onaylandı! Eser vitrinde "SATILDI" olarak işaretlendi.');
  };

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

  const totalVolume = orders.reduce((acc, o) => acc + (o.rawPrice || 0), 0);
  const totalCommissionEarned = orders.reduce((acc, o) => acc + (o.commission || 0), 0);
  const pendingApprovalsCount = orders.filter(o => o.status === 'waiting_admin_approval').length;

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, boxSizing: 'border-box', overflowX: 'hidden' }}>
      <Head>
        <title>Efnan Antika & Tarihi Eser Pazarı</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <nav style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10, boxSizing: 'border-box' }}>
        <div onClick={() => window.location.reload()} style={{ cursor: 'pointer', fontWeight: '900', fontSize: '1rem', color: '#1f2937' }}>
          🏛️ Efnan Antika & Sanat {isAdmin && <span style={{ fontSize: '0.65rem', backgroundColor: '#d97706', color: 'white', padding: '2px 5px', borderRadius: '4px', marginLeft: '4px' }}>Yönetici</span>}
        </div>
        <div>
          {currentUser ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem' }}>👤 {currentUser.username}</span>
              <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Çıkış</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Giriş / Kayıt</button>
          )}
        </div>
      </nav>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', boxSizing: 'border-box' }}>
        <button onClick={() => setActiveTab('explore')} style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'explore' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'explore' ? 'white' : '#374151', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' }}>Antika Vitrini</button>
        
        {currentUser && (
          <button onClick={() => setActiveTab('my_orders')} style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'my_orders' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'my_orders' ? 'white' : '#374151', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' }}>Siparişlerim ({orders.length})</button>
        )}
        
        {isAdmin && (
          <button onClick={() => setActiveTab('admin_panel')} style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'admin_panel' ? '#d97706' : '#fef3c7', color: activeTab === 'admin_panel' ? 'white' : '#92400e', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer', border: '1px dashed #b45309' }}>
            👑 Yönetici {pendingApprovalsCount > 0 && `(${pendingApprovalsCount})`}
          </button>
        )}
      </div>

      <main style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '16px 12px', boxSizing: 'border-box' }}>
        {activeTab === 'explore' && (
          <>
            <section style={{ backgroundColor: '#1f2937', color: 'white', padding: '24px 16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', boxSizing: 'border-box' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '6px' }}>Efnan Antika ve Tarihi Eser Koleksiyonu</h1>
              <p style={{ fontSize: '0.85rem', maxWidth: '600px', margin: '0 auto', color: '#d1d5db', lineHeight: '1.4' }}>Müzelik antikalar, orijinal yağlı boya tablolar, tarihi objeler ve güvenli havuz/kripto ödeme seçenekleri burada buluşuyor.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#111827' }}>Vitrendeki Tarihi Eserler ve Tablolar</h2>
              {listings.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '24px', textAlign: 'center', borderRadius: '8px', color: '#6b7280', fontSize: '0.9rem' }}>
                  Henüz vitrinde kayıtlı bir eser bulunmuyor. Eser eklemek için giriş yapabilirsiniz.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {listings.map((art) => {
                    const isSold = art.status === 'Satıldı';
                    const canManage = currentUser && (currentUser.email === art.user_email || isAdmin);

                    return (
                      <div key={art.id} onClick={() => !isSold && setSelectedArt(art)} style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.08)', cursor: isSold ? 'default' : 'pointer', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', opacity: isSold ? 0.75 : 1, position: 'relative' }}>
                        
                        {isSold && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#dc2626', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            🔴 SATILDI
                          </div>
                        )}

                        {art.image && (
                          <img src={art.image} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                        )}
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{art.isOriginal}</span>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Satıcı: {art.artist}</span>
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '8px 0 4px 0', color: '#1f2937' }}>{art.title}</h3>
                          </div>
                          
                          <div style={{ marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: isSold ? '#9ca3af' : '#059669', fontSize: '1.05rem' }}>{art.price}</span>
                              <button onClick={(e) => { e.stopPropagation(); handleShareArtwork(art); }} style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>🔗 Paylaş</button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px', width: '100%', flexWrap: 'wrap' }}>
                              {canManage && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); openEditModal(art); }} style={{ flex: 1, backgroundColor: '#d97706', color: 'white', border: 'none', padding: '7px 6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
                                    ✏️ Düzenle
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteMyListing(art.id); }} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '7px 6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
                                    🗑️ Kaldır
                                  </button>
                                </>
                              )}

                              {!isSold && (
                                <button onClick={(e) => { e.stopPropagation(); setSelectedArt(art); }} style={{ flex: canManage ? '100%' : 1, backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '7px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>İncele & Al</button>
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

            <section style={{ width: '100%', maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '20px 16px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', position: 'relative', boxSizing: 'border-box' }}>
              
              {!currentUser && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', borderRadius: '12px', boxSizing: 'border-box' }}>
                  <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1rem', marginBottom: '8px' }}>🔒 Eser Yüklemek İçin Giriş Yapmalısınız</p>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '14px' }}>Kendi antika ve tarihi eserlerinizi güvenli vitrine eklemek için lütfen hesabınıza giriş yapın.</p>
                  <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Giriş Yap / Kayıt Ol</button>
                </div>
              )}

              <h2 style={{ fontSize: '1.1rem', marginBottom: '4px', color: '#111827' }}>Antika veya Tarihi Eser İlanı Yükle</h2>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '14px' }}>Telefon ve IBAN numarlarınız alıcılara kesinlikle gösterilmez, işlemler havuz sistemiyle yapılır.</p>
              
              <form onSubmit={triggerListingProcess} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Eser / Antika Adı" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ fontSize: '0.72rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Durum:</label>
                    <select value={isOriginal} onChange={(e) => setIsOriginal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', fontSize: '0.88rem', boxSizing: 'border-box' }}>
                      <option value="Orijinal">Orijinal Tarihi Eser</option>
                      <option value="Antika / Dönem Parçası">Antika / Dönem Parçası</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ fontSize: '0.72rem', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Fiyat (₺):</label>
                    <input type="number" placeholder="Örn: 5000" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <textarea placeholder="Eserin tarihi, dönemi ve detaylı açıklaması" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Telefonunuz (Alıcı Göremez)" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ flex: 1, minWidth: '140px', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                  <input type="text" placeholder="IBAN Numaranız (Gizli)" value={iban} onChange={(e) => setIban(e.target.value)} required style={{ flex: 1, minWidth: '140px', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                </div>

                <div style={{ border: '2px dashed #d1d5db', padding: '14px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}>
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Önizleme" style={{ maxWidth: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />
                      <button type="button" onClick={() => setImagePreview(null)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}>Resmi Değiştir</button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: '10px' }}>Eser Fotoğrafı Ekle</p>
                      
                      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={(e) => handleImageSelect(e.target.files[0])} style={{ display: 'none' }} />
                      <input type="file" ref={galleryInputRef} accept="image/*" onChange={(e) => handleImageSelect(e.target.files[0])} style={{ display: 'none' }} />

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => cameraInputRef.current && cameraInputRef.current.click()} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '9px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' }}>📷 Kameradan Çek</button>
                        <button type="button" onClick={() => galleryInputRef.current && galleryInputRef.current.click()} style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '9px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' }}>🖼️ Galeriden Seç</button>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={uploading} style={{ width: '100%', backgroundColor: uploading ? '#9ca3af' : '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.92rem', cursor: uploading ? 'not-allowed' : 'pointer', boxSizing: 'border-box' }}>
                  {uploading ? 'Yükleniyor...' : 'Eseri Vitrine Ekle'}
                </button>
              </form>
            </section>
          </>
        )}

        {activeTab === 'my_orders' && currentUser && (
          <section style={{ width: '100%', maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', padding: '20px 16px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#111827' }}>Siparişlerim ve Ödeme Takibi</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>Henüz aktif bir siparişiniz bulunmuyor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((ord) => (
                  <div key={ord.id} style={{ border: '1px solid #e5e7eb', padding: '14px', borderRadius: '8px', backgroundColor: '#f9fafb', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', boxSizing: 'border-box' }}>
                    {ord.image && <img src={ord.image} alt={ord.artTitle} style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1f2937' }}>{ord.artTitle}</h4>
                        <span style={{ fontWeight: 'bold', color: '#059669' }}>{ord.price}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '2px' }}>Ödeme Yöntemi: <b>{ord.paymentMethod}</b></p>
                      <p style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '2px' }}>Alıcı: <b>{ord.buyerFullName}</b> | Tel: <b>{ord.buyerPhone}</b></p>
                      <p style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '2px' }}>Dekont / Hash: <span style={{ fontFamily: 'monospace', background: '#e5e7eb', padding: '2px 4px', borderRadius: '3px' }}>{ord.bankReceiptNo || 'Belirtilmemiş'}</span></p>
                      <p style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '6px' }}>Adres: <b>{ord.buyerAddress}</b></p>
                      <p style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#d97706', marginBottom: '8px' }}>Durum: {ord.statusText}</p>
                      {ord.status === 'shipping_expected' && (
                        <button onClick={() => confirmDelivery(ord.id, ord.artId)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}>Ürünü Teslim Aldım</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'admin_panel' && isAdmin && (
          <section style={{ width: '100%', maxWidth: '850px', margin: '0 auto', backgroundColor: 'white', padding: '20px 16px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', border: '2px solid #d97706', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#92400e', fontWeight: 'bold' }}>👑 Yönetici, Ciro & Komisyon Paneli (Yunus Aralı)</h2>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Komisyon: %10</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 'bold', textTransform: 'uppercase' }}>Toplam Satış Hacmi</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>{totalVolume.toLocaleString('tr-TR')} ₺</p>
              </div>
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 'bold', textTransform: 'uppercase' }}>Net Site Kazancınız (%10)</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669', marginTop: '4px' }}>{totalCommissionEarned.toLocaleString('tr-TR')} ₺</p>
              </div>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 'bold', textTransform: 'uppercase' }}>Toplam Sipariş</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e40af', marginTop: '4px' }}>{orders.length} Adet</p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: '16px', lineHeight: '1.4' }}>Alıcıların yaptığı havaleler veya kripto transferleri hesabınıza geçtiğinde <b>Dekont/İşlem Hash No</b>'yu kontrol edip onaylayın.</p>

            {orders.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>Henüz bekleyen sipariş veya işlem yok.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((ord) => (
                  <div key={ord.id} style={{ border: '1px solid #fcd34d', padding: '14px', borderRadius: '8px', backgroundColor: '#fffbeb', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', boxSizing: 'border-box' }}>
                    {ord.image && <img src={ord.image} alt={ord.artTitle} style={{ width: '75px', height: '75px', objectFit: 'cover', borderRadius: '6px' }} />}
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1f2937' }}>{ord.artTitle}</h4>
                        <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '1rem' }}>Satış: {ord.price}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#1f2937', marginBottom: '2px' }}><b>Ödeme Yöntemi:</b> {ord.paymentMethod}</p>
                      <p style={{ fontSize: '0.8rem', color: '#1f2937', marginBottom: '2px' }}><b>Alıcı:</b> {ord.buyerFullName} ({ord.buyerPhone})</p>
                      <p style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '2px', backgroundColor: '#fef3c7', padding: '3px 6px', borderRadius: '4px', display: 'inline-block' }}>🧾 <b>Dekont/Hash No:</b> {ord.bankReceiptNo || 'Belirtilmemiş'}</p>
                      
                      <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', margin: '6px 0', fontSize: '0.78rem' }}>
                        <p style={{ color: '#047857', marginBottom: '2px' }}>🏛️ Komisyon (%10): <b>{ord.commission ? `${ord.commission.toLocaleString('tr-TR')} ₺` : '-'}</b></p>
                        <p style={{ color: '#1d4ed8', marginBottom: '2px' }}>💸 Satıcıya Net Tutar: <b>{ord.sellerPayout ? `${ord.sellerPayout.toLocaleString('tr-TR')} ₺` : '-'}</b></p>
                        <p style={{ color: '#374151' }}>🏦 Satıcı Gizli IBAN: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{ord.sellerIban || 'Belirtilmemiş'}</span></p>
                      </div>

                      <p style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#d97706', marginBottom: '8px' }}><b>Durum:</b> {ord.statusText}</p>
                      
                      {ord.status === 'waiting_admin_approval' && (
                        <button onClick={() => adminApprovePayment(ord.id, ord.artId)} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          ✅ Ödemeyi Onayla (Satıldı İşaretle)
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

      {/* DETAY MODALI */}
      {selectedArt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', zIndex: 50, boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '420px', width: '100%', overflow: 'hidden', boxShadow: '0 10px 15px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            {selectedArt.image && (
              <img src={selectedArt.image} alt={selectedArt.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px', color: '#1f2937' }}>{selectedArt.title}</h3>
                <button onClick={() => handleShareArtwork(selectedArt)} style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: 'none', padding: '5px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>🔗 Paylaş</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>Koleksiyon Sahibi: {selectedArt.artist}</p>
              <p style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold', marginBottom: '6px' }}>Satıcı İletişimi: Gizli (Güvenli Havuzda)</p>
              <p style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: '14px', lineHeight: '1.4' }}>{selectedArt.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#059669' }}>{selectedArt.price}</span>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{selectedArt.isOriginal}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {currentUser && (currentUser.email === selectedArt.user_email || isAdmin) && (
                  <>
                    <button onClick={() => openEditModal(selectedArt)} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '10px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem' }}>
                      ✏️ Düzenle
                    </button>
                    <button onClick={() => handleDeleteMyListing(selectedArt.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem' }}>
                      🗑️ Kaldır
                    </button>
                  </>
                )}
                <button onClick={() => { setSelectedArt(null); triggerBuyProcess(selectedArt); }} style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Hemen Satın Al</button>
                <button onClick={() => setSelectedArt(null)} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÜRÜN DÜZENLEME MODALI */}
      {showEditModal && editingArt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', zIndex: 65, boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '20px 16px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px', color: '#1f2937' }}>✏️ Eser Bilgilerini Düzenle</h3>
            
            <form onSubmit={handleUpdateArtwork} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Eser Adı:</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.72rem', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Durum:</label>
                  <select value={editIsOriginal} onChange={(e) => setEditIsOriginal(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}>
                    <option value="Orijinal">Orijinal Tarihi Eser</option>
                    <option value="Antika / Dönem Parçası">Antika / Dönem Parçası</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.72rem', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Fiyat (₺):</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#4b5563', display: 'block', marginBottom: '3px' }}>Açıklama:</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={editLoading} style={{ flex: 1, backgroundColor: editLoading ? '#9ca3af' : '#d97706', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: editLoading ? 'not-allowed' : 'pointer' }}>
                  {editLoading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingArt(null); }} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ÖDEME, QR KOD, KRİPTO VE ALICI BİLGİLERİ MODALI */}
      {showPaymentModal && pendingArtData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', zIndex: 60, overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '20px 16px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '4px', color: '#1f2937' }}>🏛️ Güvenli Ödeme & Dekont/Hash Formu</h3>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '10px' }}>Eser: <b>{pendingArtData.title}</b> — <span style={{ color: '#059669', fontWeight: 'bold' }}>Tutar: {pendingArtData.price}</span></p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '4px' }}>Ödeme Yöntemi Seçin:</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => setPaymentType('bank')} style={{ flex: 1, padding: '7px 4px', borderRadius: '6px', border: paymentType === 'bank' ? '2px solid #4f46e5' : '1px solid #d1d5db', backgroundColor: paymentType === 'bank' ? '#eef2ff' : 'white', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>🏦 Havale/EFT</button>
                <button type="button" onClick={() => setPaymentType('usdt')} style={{ flex: 1, padding: '7px 4px', borderRadius: '6px', border: paymentType === 'usdt' ? '2px solid #059669' : '1px solid #d1d5db', backgroundColor: paymentType === 'usdt' ? '#ecfdf5' : 'white', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>🪙 USDT</button>
                <button type="button" onClick={() => setPaymentType('btc')} style={{ flex: 1, padding: '7px 4px', borderRadius: '6px', border: paymentType === 'btc' ? '2px solid #d97706' : '1px solid #d1d5db', backgroundColor: paymentType === 'btc' ? '#fffbeb' : 'white', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>₿ BTC</button>
              </div>
            </div>

            {paymentType === 'bank' && (
              <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '12px', fontSize: '0.8rem' }}>
                <p style={{ fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>İş Bankası Havuz Hesabı:</p>
                <p style={{ marginBottom: '2px' }}>Alıcı: <b>{escrowAccounts.accountHolder}</b></p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold', color: '#1f2937', margin: '4px 0', background: 'white', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', wordBreak: 'break-all' }}>{escrowAccounts.tlIban}</p>
                <p style={{ fontSize: '0.72rem', color: '#15803d' }}>💡 Açıklamaya ürün adını yazınız.</p>
              </div>
            )}

            {(paymentType === 'usdt' || paymentType === 'btc') && (
              <div style={{ backgroundColor: '#fdf8f6', padding: '10px', borderRadius: '8px', border: '1px solid #fed7aa', marginBottom: '12px', textAlign: 'center', fontSize: '0.8rem' }}>
                <p style={{ fontWeight: 'bold', color: '#9a3412', marginBottom: '4px' }}>{paymentType === 'usdt' ? 'USDT' : 'Bitcoin'} Bilgileri ({escrowAccounts.cryptoNetwork}):</p>
                
                <div style={{ margin: '6px 0', background: 'white', padding: '6px', display: 'inline-block', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(paymentType === 'usdt' ? escrowAccounts.usdtWallet : escrowAccounts.btcWallet)}`} 
                    alt="Cüzdan QR" 
                    style={{ width: '110px', height: '110px', display: 'block' }}
                  />
                </div>

                <p style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: '3px' }}>Cüzdan Adresi (Kopyalamak için dokunun):</p>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(paymentType === 'usdt' ? escrowAccounts.usdtWallet : escrowAccounts.btcWallet);
                    alert('✅ Cüzdan adresi kopyalandı!');
                  }}
                  style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 'bold', color: '#1f2937', background: 'white', padding: '6px', borderRadius: '4px', border: '1px dashed #f97316', cursor: 'pointer', wordBreak: 'break-all' }}
                >
                  {paymentType === 'usdt' ? escrowAccounts.usdtWallet : escrowAccounts.btcWallet} 📋
                </div>
                <p style={{ fontSize: '0.68rem', color: '#c2410c', marginTop: '3px' }}>⚠️ Sadece BSC (BEP20) ağı kullanın.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>📦 Teslimat Bilgileri</p>
              
              <input type="text" placeholder="Adınız ve Soyadınız" value={buyerFullName} onChange={(e) => setBuyerFullName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', boxSizing: 'border-box' }} />
              
              <input type="text" placeholder="İrtibat Telefon Numaranız" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', boxSizing: 'border-box' }} />
              
              <input type="text" placeholder={paymentType === 'bank' ? "Banka Dekont / Referans Numarası" : "Kripto İşlem Hash (TxID) No"} value={bankReceiptNo} onChange={(e) => setBankReceiptNo(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', backgroundColor: '#fffbeb', boxSizing: 'border-box' }} />

              <textarea placeholder="Açık Kargo Adresi (Mahalle, Cadde, No, İlçe/İl)" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={2} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', boxSizing: 'border-box' }} />

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '2px', backgroundColor: '#f9fafb', padding: '6px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <input type="checkbox" checked={havaleConfirmed} onChange={(e) => setHavaleConfirmed(e.target.checked)} />
                <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 'bold' }}>Ödemeyi yaptım ve bilgileri doğru girdim.</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={confirmOrderWithEscrow} disabled={paymentProcessing} style={{ flex: 1, backgroundColor: paymentProcessing ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: paymentProcessing ? 'not-allowed' : 'pointer' }}>
                {paymentProcessing ? 'Gönderiliyor...' : 'Ödemeyi Bildir'}
              </button>
              <button onClick={() => setShowPaymentModal(false)} disabled={paymentProcessing} style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* GİRİŞ / KAYIT MODALI */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', zIndex: 60, boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '340px', width: '100%', padding: '20px 16px', boxShadow: '0 10px 15px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center', color: '#1f2937' }}>{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h3>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {authMode === 'register' && (
                <input type="text" placeholder="Kullanıcı adı" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', boxSizing: 'border-box' }} />
              )}
              <input type="email" placeholder="E-posta Adresi" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', boxSizing: 'border-box' }} />
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Şifre" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '8px', paddingRight: '34px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.82rem', boxSizing: 'border-box' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
              
              <button type="submit" disabled={authLoading} style={{ width: '100%', backgroundColor: authLoading ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', marginTop: '4px', boxSizing: 'border-box' }}>
                {authLoading ? 'İşleniyor...' : (authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                {authMode === 'login' ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
              </button>
              <div style={{ marginTop: '6px' }}>
                <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
