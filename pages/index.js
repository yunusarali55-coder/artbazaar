import { useState, useEffect } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ftfhfwiqbwfxolebcqdx.supabase.co';

const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Z2Z3aGlxYndmeG9sZWJjcWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTMyOTcsImV4cCI6MjEwMzQ2OTI5N30.efUIMqDHizg7zd4YCkiouCzX0GjpBl7AHkAz0nLpBdI';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [selectedArt, setSelectedArt] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingArtData, setPendingArtData] = useState(null);
  const [showExchangeInfo, setShowExchangeInfo] = useState(false);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');

  const [listings, setListings] = useState([
    {
      id: 'demo-1',
      title: 'Neon Rüya',
      description:
        'Renklerin ve neon ışıkların büyüleyici dansı.',
      artist: 'Yunus Aralı',
      phone: '05443433881',
      price: '0.05 ETH',
      duration: 'Süresiz / Yayında',
      image:
        'https://picsum.photos/seed/art1/1200/800',
      status: 'Satışta'
    },
    {
      id: 'demo-2',
      title: 'Kozmik Yansımalar',
      description:
        'Uzayın ve derinlik algısının harmanlandığı eser.',
      artist: 'Efnan Sanat',
      phone: '05443433881',
      price: '0.08 ETH',
      duration: 'Süresiz / Yayında',
      image:
        'https://picsum.photos/seed/art2/1200/800',
      status: 'Satışta'
    }
  ]);

  const platformWalletAddress =
    '0xAd58d1050942F795E651153231Ce8A152180C055';

  // =========================================================
  // SAYFA AÇILIŞI
  // =========================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedUser =
      localStorage.getItem('efnan_user');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error(
          'Kullanıcı bilgisi okunamadı:',
          error
        );
        localStorage.removeItem('efnan_user');
      }
    }

    const savedOrders =
      localStorage.getItem('efnan_orders');

    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);

        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
        }
      } catch (error) {
        console.error(
          'Sipariş bilgileri okunamadı:',
          error
        );
        localStorage.removeItem('efnan_orders');
      }
    }

    fetchArtworksFromSupabase();
  }, []);

  // =========================================================
  // SUPABASE'DEN ESERLERİ GETİR
  // =========================================================

  const fetchArtworksFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', {
          ascending: false
        });

      if (error) {
        console.error(
          'Supabase eser getirme hatası:',
          error
        );

        return;
      }

      const formattedArtworks = Array.isArray(data)
        ? data.map((art) => ({
            id: art.id,
            title: art.title || 'İsimsiz Eser',
            description:
              art.description || 'Açıklama yok',
            artist:
              art.artist || 'Anonim',
            phone:
              art.phone || 'Belirtilmedi',
            price:
              art.price !== null &&
              art.price !== undefined
                ? `${art.price} ETH`
                : '0.015 ETH',
            duration:
              'Süresiz / Yayında',
            image:
              art.image_url ||
              'https://picsum.photos/seed/default/1200/800',
            status: 'Satışta'
          }))
        : [];

      setListings([
        ...formattedArtworks,
        {
          id: 'demo-1',
          title: 'Neon Rüya',
          description:
            'Renklerin ve neon ışıkların büyüleyici dansı.',
          artist: 'Yunus Aralı',
          phone: '05443433881',
          price: '0.05 ETH',
          duration: 'Süresiz / Yayında',
          image:
            'https://picsum.photos/seed/art1/1200/800',
          status: 'Satışta'
        },
        {
          id: 'demo-2',
          title: 'Kozmik Yansımalar',
          description:
            'Uzayın ve derinlik algısının harmanlandığı eser.',
          artist: 'Efnan Sanat',
          phone: '05443433881',
          price: '0.08 ETH',
          duration: 'Süresiz / Yayında',
          image:
            'https://picsum.photos/seed/art2/1200/800',
          status: 'Satışta'
        }
      ]);
    } catch (error) {
      console.error(
        'Eserler alınırken beklenmeyen hata:',
        error
      );
    }
  };

  // =========================================================
  // RESİM SEÇİMİ
  // =========================================================

  const handleImageSelect = (file) => {
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      alert(
        '❌ Lütfen sadece resim dosyası seçin.'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(
        '❌ Resim en fazla 10 MB olabilir.'
      );
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl =
      URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
  };

  // =========================================================
  // RESİMİ KÜÇÜLT
  // =========================================================

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

          if (
            width > MAX_WIDTH ||
            height > MAX_HEIGHT
          ) {
            const ratio = Math.min(
              MAX_WIDTH / width,
              MAX_HEIGHT / height
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas =
            document.createElement('canvas');

          canvas.width = width;
          canvas.height = height;

          const ctx =
            canvas.getContext('2d');

          if (!ctx) {
            reject(
              new Error(
                'Resim işleme alanı oluşturulamadı.'
              )
            );
            return;
          }

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    'Resim sıkıştırılamadı.'
                  )
                );
                return;
              }

              resolve(blob);
            },
            'image/jpeg',
            0.82
          );
        };

        img.onerror = () => {
          reject(
            new Error(
              'Resim okunamadı.'
            )
          );
        };

        img.src = event.target.result;
      };

      reader.onerror = () => {
        reject(
          new Error(
            'Dosya okunamadı.'
          )
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // =========================================================
  // FORM TEMİZLEME
  // =========================================================

  const resetImageSelection = () => {
    setImageFile(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(null);

    const cameraInput =
      document.getElementById(
        'camera-image-input'
      );

    const galleryInput =
      document.getElementById(
        'gallery-image-input'
      );

    if (cameraInput) {
      cameraInput.value = '';
    }

    if (galleryInput) {
      galleryInput.value = '';
    }
  };

  const resetListingForm = () => {
    setTitle('');
    setDescription('');
    setPhone('');
    resetImageSelection();
  };

  // =========================================================
  // ESER YÜKLEME
  // =========================================================

  const triggerListingProcess = async (e) => {
    e.preventDefault();

    if (uploading) return;

    if (!currentUser) {
      alert(
        '❌ Eser listelemek için önce giriş yapmalısınız!'
      );

      setShowAuthModal(true);
      return;
    }

    if (!title.trim()) {
      alert(
        '❌ Lütfen eser adını girin.'
      );
      return;
    }

    if (!phone.trim()) {
      alert(
        '❌ Lütfen iletişim telefon numaranızı girin.'
      );
      return;
    }

    if (!imageFile) {
      alert(
        '❌ Lütfen kamera ile fotoğraf çekin veya galeriden/dosyadan bir resim seçin.'
      );
      return;
    }

    setUploading(true);

    let uploadedFilePath = null;

    try {
      // -----------------------------------------------------
      // 1. RESMİ SIKIŞTIR
      // -----------------------------------------------------

      const compressedBlob =
        await compressImage(imageFile);

      // -----------------------------------------------------
      // 2. BENZERSİZ DOSYA ADI OLUŞTUR
      // -----------------------------------------------------

      const uniqueName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}.jpg`;

      uploadedFilePath =
        `uploads/${uniqueName}`;

      console.log(
        'Storage dosya yolu:',
        uploadedFilePath
      );

      // -----------------------------------------------------
      // 3. SUPABASE STORAGE'A YÜKLE
      // -----------------------------------------------------

      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage
        .from('artworks')
        .upload(
          uploadedFilePath,
          compressedBlob,
          {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg'
          }
        );

      console.log(
        'Storage upload sonucu:',
        uploadData
      );

      if (uploadError) {
        console.error(
          'Storage upload hatası:',
          uploadError
        );

        throw new Error(
          `Resim yüklenemedi: ${uploadError.message}`
        );
      }

      // -----------------------------------------------------
      // 4. PUBLIC URL AL
      // -----------------------------------------------------

      const {
        data: publicUrlData
      } = supabase.storage
        .from('artworks')
        .getPublicUrl(
          uploadedFilePath
        );

      const imageUrl =
        publicUrlData?.publicUrl;

      console.log(
        'Oluşturulan resim URL:',
        imageUrl
      );

      if (!imageUrl) {
        throw new Error(
          'Resim URL adresi oluşturulamadı.'
        );
      }

      // -----------------------------------------------------
      // 5. ARTWORKS TABLOSUNA KAYDET
      // -----------------------------------------------------

      const artworkData = {
        title: title.trim(),
        description:
          description.trim() ||
          'Açıklama yok',
        price: 0.015,
        image_url: imageUrl,
        artist:
          currentUser.username ||
          'Anonim',
        phone: phone.trim()
      };

      console.log(
        'Veritabanına gönderilecek eser:',
        artworkData
      );

      const {
        data: insertedArtwork,
        error: insertError
      } = await supabase
        .from('artworks')
        .insert([artworkData])
        .select();

      console.log(
        'Veritabanı sonucu:',
        insertedArtwork
      );

      if (insertError) {
        console.error(
          'Veritabanı kayıt hatası:',
          insertError
        );

        // Veritabanı başarısızsa Storage'daki resmi sil
        if (uploadedFilePath) {
          const {
            error: removeError
          } = await supabase.storage
            .from('artworks')
            .remove([
              uploadedFilePath
            ]);

          if (removeError) {
            console.error(
              'Yüklenen resim silinemedi:',
              removeError
            );
          }
        }

        throw new Error(
          `Veritabanına kayıt hatası: ${insertError.message}`
        );
      }

      // -----------------------------------------------------
      // 6. FORMU TEMİZLE
      // -----------------------------------------------------

      resetListingForm();

      // -----------------------------------------------------
      // 7. LİSTEYİ YENİLE
      // -----------------------------------------------------

      await fetchArtworksFromSupabase();

      alert(
        '✅ Eseriniz başarıyla yüklendi ve vitrine eklendi!'
      );
    } catch (error) {
      console.error(
        'Eser yükleme işlemi tamamen başarısız:',
        error
      );

      alert(
        '❌ Eser yüklenirken hata oluştu:\n\n' +
          (error?.message ||
            'Bilinmeyen hata')
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // KAYIT
  // =========================================================

  const handleRegister = (e) => {
    e.preventDefault();

    if (
      !email.trim() ||
      !password ||
      !username.trim()
    ) {
      alert(
        '❌ Lütfen tüm alanları doldurun.'
      );
      return;
    }

    if (password.length < 6) {
      alert(
        '❌ Şifre en az 6 karakter olmalıdır.'
      );
      return;
    }

    const newUser = {
      username: username.trim(),
      email: email.trim().toLowerCase()
    };

    localStorage.setItem(
      'efnan_user',
      JSON.stringify(newUser)
    );

    setCurrentUser(newUser);
    setShowAuthModal(false);

    setEmail('');
    setPassword('');
    setUsername('');

    alert('✅ Kayıt başarılı!');
  };

  // =========================================================
  // GİRİŞ
  // =========================================================

  const handleLogin = (e) => {
    e.preventDefault();

    if (
      !email.trim() ||
      !password
    ) {
      alert(
        '❌ Lütfen e-posta ve şifrenizi girin.'
      );
      return;
    }

    const existingUser = {
      username:
        email
          .trim()
          .toLowerCase()
          .split('@')[0],
      email:
        email
          .trim()
          .toLowerCase()
    };

    localStorage.setItem(
      'efnan_user',
      JSON.stringify(existingUser)
    );

    setCurrentUser(existingUser);
    setShowAuthModal(false);

    setEmail('');
    setPassword('');

    alert('✅ Giriş yapıldı!');
  };

  // =========================================================
  // ÇIKIŞ
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      'efnan_user'
    );

    setCurrentUser(null);

    alert('Çıkış yapıldı.');
  };

  // =========================================================
  // SATIN AL
  // =========================================================

  const triggerBuyProcess = (art) => {
    if (!currentUser) {
      alert(
        '❌ Satın almak için giriş yapmalısınız!'
      );

      setShowAuthModal(true);
      return;
    }

    setPendingArtData(art);
    setShowPaymentModal(true);
  };

  // =========================================================
  // SİPARİŞ OLUŞTUR
  // =========================================================

  const createNewOrder = (
    paymentMethod
  ) => {
    if (
      !pendingArtData ||
      !currentUser
    ) {
      return;
    }

    const newOrder = {
      id: Date.now(),
      artTitle:
        pendingArtData.title,
      artist:
        pendingArtData.artist,
      phone:
        pendingArtData.phone,
      price:
        pendingArtData.price,
      buyer:
        currentUser.username,
      paymentMethod,
      status:
        'Sipariş Alındı (Hazırlanıyor)',
      date:
        new Date().toLocaleDateString(
          'tr-TR'
        )
    };

    const updatedOrders = [
      newOrder,
      ...orders
    ];

    setOrders(updatedOrders);

    localStorage.setItem(
      'efnan_orders',
      JSON.stringify(
        updatedOrders
      )
    );

    setShowPaymentModal(false);
    setShowExchangeInfo(false);
    setPendingArtData(null);

    alert(
      '✅ Siparişiniz başarıyla oluşturuldu! "Siparişlerim" sekmesinden takip edebilirsiniz.'
    );

    setActiveTab('my_orders');
  };

  // =========================================================
  // SİPARİŞ DURUMU
  // =========================================================

  const updateOrderStatus = (
    orderId,
    newStatus
  ) => {
    const updated = orders.map(
      (order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus
            }
          : order
    );

    setOrders(updated);

    localStorage.setItem(
      'efnan_orders',
      JSON.stringify(updated)
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        fontFamily:
          'Arial, Helvetica, sans-serif'
      }}
    >
      <Head>
        <title>
          Efnan ArtBazaar
        </title>

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <meta
          name="description"
          content="Efnan ArtBazaar - Sanat eserlerini keşfet, sergile ve satın al."
        />
      </Head>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'white',
          borderBottom:
            '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div
          onClick={() =>
            setActiveTab('explore')
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: '#222',
            cursor: 'pointer'
          }}
        >
          <span
            style={{
              fontWeight: '900',
              background:
                'linear-gradient(45deg, #ff4d4d, #f6851b, #10b981, #4f46e5, #ec4899)',
              WebkitBackgroundClip:
                'text',
              WebkitTextFillColor:
                'transparent',
              fontSize: '1.1rem'
            }}
          >
            Efnan ArtBazaar
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          {currentUser ? (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center'
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem'
                }}
              >
                👤{' '}
                {
                  currentUser.username
                }
              </span>

              <button
                onClick={
                  handleLogout
                }
                style={{
                  backgroundColor:
                    '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding:
                    '4px 8px',
                  borderRadius:
                    '4px',
                  fontSize:
                    '0.75rem',
                  cursor:
                    'pointer'
                }}
              >
                Çıkış
              </button>
            </div>
          ) : (
            <button
              onClick={() =>
                setShowAuthModal(true)
              }
              style={{
                backgroundColor:
                  '#10b981',
                color: 'white',
                border: 'none',
                padding:
                  '6px 10px',
                borderRadius:
                  '6px',
                fontSize:
                  '0.8rem',
                fontWeight:
                  'bold',
                cursor:
                  'pointer'
              }}
            >
              Giriş Yap
            </button>
          )}
        </div>
      </nav>

      {/* =====================================================
          SEKME MENÜSÜ
      ===================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'center',
          gap: '10px',
          padding: '12px',
          backgroundColor: 'white',
          borderBottom:
            '1px solid #e5e7eb',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() =>
            setActiveTab('explore')
          }
          style={{
            padding:
              '8px 16px',
            borderRadius:
              '6px',
            border: 'none',
            backgroundColor:
              activeTab ===
              'explore'
                ? '#4f46e5'
                : '#e5e7eb',
            color:
              activeTab ===
              'explore'
                ? 'white'
                : '#374151',
            fontWeight:
              'bold',
            cursor:
              'pointer'
          }}
        >
          Keşfet & Satın Al
        </button>

        <button
          onClick={() =>
            setActiveTab('my_orders')
          }
          style={{
            padding:
              '8px 16px',
            borderRadius:
              '6px',
            border: 'none',
            backgroundColor:
              activeTab ===
              'my_orders'
                ? '#4f46e5'
                : '#e5e7eb',
            color:
              activeTab ===
              'my_orders'
                ? 'white'
                : '#374151',
            fontWeight:
              'bold',
            cursor:
              'pointer'
          }}
        >
          Siparişlerim (
          {orders.length})
        </button>
      </div>

      <main
        style={{
          maxWidth:
            '1200px',
          margin:
            '0 auto',
          padding:
            '20px 12px'
        }}
      >
        {/* ===================================================
            KEŞFET
        =================================================== */}

        {activeTab ===
          'explore' && (
          <>
            {/* HERO */}

            <div
              style={{
                textAlign:
                  'center',
                marginBottom:
                  '30px',
                backgroundColor:
                  '#1f2937',
                color: 'white',
                padding:
                  '30px 20px',
                borderRadius:
                  '12px'
              }}
            >
              <h1
                style={{
                  fontSize:
                    '1.5rem',
                  marginBottom:
                    '8px'
                }}
              >
                Sanat ve Eser
                Pazarı
              </h1>

              <p
                style={{
                  fontSize:
                    '0.85rem',
                  color:
                    '#9ca3af'
                }}
              >
                Değerli
                eserlerinizi
                güvenle
                sergileyin ve
                keşfedin.
              </p>
            </div>

            {/* =================================================
                VİTRİN
            ================================================= */}

            <section
              style={{
                marginBottom:
                  '40px'
              }}
            >
              <h2
                style={{
                  fontSize:
                    '1.3rem',
                  marginBottom:
                    '14px',
                  color:
                    '#1f2937'
                }}
              >
                Vitrin
                (Süresiz
                Yayında)
              </h2>

              {listings.length ===
              0 ? (
                <p
                  style={{
                    color:
                      '#6b7280'
                  }}
                >
                  Henüz eser
                  bulunmuyor.
                </p>
              ) : (
                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '16px'
                  }}
                >
                  {listings.map(
                    (art) => (
                      <div
                        key={
                          art.id
                        }
                        onClick={() =>
                          setSelectedArt(
                            art
                          )
                        }
                        style={{
                          backgroundColor:
                            'white',
                          borderRadius:
                            '12px',
                          overflow:
                            'hidden',
                          boxShadow:
                            '0 4px 6px rgba(0,0,0,0.1)',
                          cursor:
                            'pointer'
                        }}
                      >
                        <img
                          src={
                            art.image
                          }
                          alt={
                            art.title
                          }
                          loading="lazy"
                          onError={(
                            e
                          ) => {
                            e.currentTarget.src =
                              'https://picsum.photos/seed/default/1200/800';
                          }}
                          style={{
                            width:
                              '100%',
                            height:
                              '180px',
                            objectFit:
                              'cover',
                            display:
                              'block'
                          }}
                        />

                        <div
                          style={{
                            padding:
                              '12px'
                          }}
                        >
                          <h3
                            style={{
                              fontSize:
                                '1rem',
                              fontWeight:
                                'bold',
                              margin:
                                '0 0 6px 0'
                            }}
                          >
                            {
                              art.title
                            }
                          </h3>

                          <p
                            style={{
                              fontSize:
                                '0.8rem',
                              color:
                                '#6b7280',
                              margin:
                                '4px 0'
                            }}
                          >
                            Sanatçı:{' '}
                            {
                              art.artist
                            }
                          </p>

                          <p
                            style={{
                              fontSize:
                                '0.8rem',
                              color:
                                '#059669',
                              margin:
                                '4px 0'
                            }}
                          >
                            📞 İletişim:{' '}
                            {
                              art.phone
                            }
                          </p>

                          <p
                            style={{
                              fontSize:
                                '0.75rem',
                              color:
                                '#d97706',
                              marginTop:
                                '4px'
                            }}
                          >
                            ⏳ Durum:{' '}
                            {
                              art.duration
                            }
                          </p>

                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              alignItems:
                                'center',
                              marginTop:
                                '10px'
                            }}
                          >
                            <span
                              style={{
                                fontWeight:
                                  'bold',
                                color:
                                  '#059669'
                              }}
                            >
                              {
                                art.price
                              }
                            </span>

                            <button
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                triggerBuyProcess(
                                  art
                                );
                              }}
                              style={{
                                backgroundColor:
                                  '#10b981',
                                color:
                                  'white',
                                border:
                                  'none',
                                padding:
                                  '6px 10px',
                                borderRadius:
                                  '6px',
                                fontSize:
                                  '0.8rem',
                                fontWeight:
                                  'bold',
                                cursor:
                                  'pointer'
                              }}
                            >
                              Satın Al
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* =================================================
                ESER YÜKLEME
            ================================================= */}

            <section
              style={{
                maxWidth:
                  '600px',
                margin:
                  '0 auto',
                backgroundColor:
                  'white',
                padding:
                  '20px',
                borderRadius:
                  '12px',
                boxShadow:
                  '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <h2
                style={{
                  fontSize:
                    '1.2rem',
                  marginBottom:
                    '6px'
                }}
              >
                Eserini Çek /
                Seç & Ekle
              </h2>

              <p
                style={{
                  fontSize:
                    '0.8rem',
                  color:
                    '#6b7280',
                  marginBottom:
                    '14px'
                }}
              >
                Kameranı kullanarak
                yeni fotoğraf
                çekebilir veya
                galerinden /
                dosyalarından
                mevcut bir
                fotoğraf
                seçebilirsin.
              </p>

              <form
                onSubmit={
                  triggerListingProcess
                }
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '12px'
                }}
              >
                <input
                  type="text"
                  placeholder="Eser Adı"
                  value={title}
                  onChange={(
                    e
                  ) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  required
                  style={{
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    border:
                      '1px solid #d1d5db',
                    fontSize:
                      '16px'
                  }}
                />

                <textarea
                  placeholder="Eser Açıklaması"
                  value={
                    description
                  }
                  onChange={(
                    e
                  ) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows="2"
                  style={{
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    border:
                      '1px solid #d1d5db',
                    fontSize:
                      '16px',
                    resize:
                      'vertical'
                  }}
                />

                <input
                  type="text"
                  placeholder="İletişim / Telefon Numarası"
                  value={phone}
                  onChange={(
                    e
                  ) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  required
                  style={{
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    border:
                      '1px solid #d1d5db',
                    fontSize:
                      '16px'
                  }}
                />

                {/* FOTOĞRAF ALANI */}

                <div
                  style={{
                    border:
                      '2px dashed #4f46e5',
                    padding:
                      '16px',
                    borderRadius:
                      '8px',
                    backgroundColor:
                      '#eef2ff',
                    textAlign:
                      'center'
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        '1rem',
                      color:
                        '#4f46e5',
                      fontWeight:
                        'bold',
                      marginBottom:
                        '12px'
                    }}
                  >
                    🖼️ Eser Fotoğrafı
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      gap: '8px',
                      justifyContent:
                        'center',
                      flexWrap:
                        'wrap'
                    }}
                  >
                    {/* KAMERA */}

                    <label
                      style={{
                        backgroundColor:
                          '#4f46e5',
                        color:
                          'white',
                        padding:
                          '11px 14px',
                        borderRadius:
                          '7px',
                        fontSize:
                          '0.85rem',
                        fontWeight:
                          'bold',
                        cursor:
                          'pointer',
                        display:
                          'inline-block',
                        opacity:
                          uploading
                            ? 0.5
                            : 1
                      }}
                    >
                      📷 Kamera ile
                      Çek

                      <input
                        id="camera-image-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={
                          uploading
                        }
                        onChange={(
                          e
                        ) => {
                          const file =
                            e.target
                              .files?.[0];

                          if (file) {
                            handleImageSelect(
                              file
                            );
                          }
                        }}
                        style={{
                          display:
                            'none'
                        }}
                      />
                    </label>

                    {/* GALERİ */}

                    <label
                      style={{
                        backgroundColor:
                          '#059669',
                        color:
                          'white',
                        padding:
                          '11px 14px',
                        borderRadius:
                          '7px',
                        fontSize:
                          '0.85rem',
                        fontWeight:
                          'bold',
                        cursor:
                          'pointer',
                        display:
                          'inline-block',
                        opacity:
                          uploading
                            ? 0.5
                            : 1
                      }}
                    >
                      📁 Galeri /
                      Dosya Seç

                      <input
                        id="gallery-image-input"
                        type="file"
                        accept="image/*"
                        disabled={
                          uploading
                        }
                        onChange={(
                          e
                        ) => {
                          const file =
                            e.target
                              .files?.[0];

                          if (file) {
                            handleImageSelect(
                              file
                            );
                          }
                        }}
                        style={{
                          display:
                            'none'
                        }}
                      />
                    </label>
                  </div>

                  {/* ÖNİZLEME */}

                  {imagePreview && (
                    <div
                      style={{
                        marginTop:
                          '15px'
                      }}
                    >
                      <img
                        src={
                          imagePreview
                        }
                        alt="Seçilen eser"
                        style={{
                          width:
                            '100%',
                          maxWidth:
                            '320px',
                          height:
                            '220px',
                          objectFit:
                            'cover',
                          borderRadius:
                            '8px',
                          display:
                            'block',
                          margin:
                            '0 auto'
                        }}
                      />

                      <p
                        style={{
                          fontSize:
                            '0.75rem',
                          color:
                            '#059669',
                          marginTop:
                            '8px'
                        }}
                      >
                        ✅ Fotoğraf
                        hazır
                      </p>

                      <button
                        type="button"
                        disabled={
                          uploading
                        }
                        onClick={
                          resetImageSelection
                        }
                        style={{
                          marginTop:
                            '5px',
                          backgroundColor:
                            '#ef4444',
                          color:
                            'white',
                          border:
                            'none',
                          padding:
                            '6px 10px',
                          borderRadius:
                            '5px',
                          cursor:
                            uploading
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize:
                            '0.75rem'
                        }}
                      >
                        ❌ Fotoğrafı
                        Kaldır
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    uploading
                  }
                  style={{
                    backgroundColor:
                      uploading
                        ? '#9ca3af'
                        : '#059669',
                    color:
                      'white',
                    border:
                      'none',
                    padding:
                      '12px',
                    borderRadius:
                      '6px',
                    fontWeight:
                      'bold',
                    cursor:
                      uploading
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize:
                      '15px'
                  }}
                >
                  {uploading
                    ? '⏳ Resim yükleniyor...'
                    : '🚀 Eseri Vitrine Ekle'}
                </button>
              </form>
            </section>
          </>
        )}

        {/* ===================================================
            SİPARİŞLER
        =================================================== */}

        {activeTab ===
          'my_orders' && (
          <div>
            <h2
              style={{
                fontSize:
                  '1.3rem',
                marginBottom:
                  '16px'
              }}
            >
              Sipariş Takip &
              İletişim Paneli
            </h2>

            {orders.length ===
            0 ? (
              <p
                style={{
                  color:
                    '#6b7280'
                }}
              >
                Henüz bir
                siparişiniz
                bulunmuyor.
              </p>
            ) : (
              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '12px'
                }}
              >
                {orders.map(
                  (order) => (
                    <div
                      key={
                        order.id
                      }
                      style={{
                        backgroundColor:
                          'white',
                        padding:
                          '16px',
                        borderRadius:
                          '8px',
                        boxShadow:
                          '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <h3
                        style={{
                          fontSize:
                            '1.1rem',
                          color:
                            '#111827'
                        }}
                      >
                        {
                          order.artTitle
                        }
                      </h3>

                      <p
                        style={{
                          fontSize:
                            '0.85rem',
                          color:
                            '#4b5563'
                        }}
                      >
                        Sanatçı:{' '}
                        {
                          order.artist
                        }{' '}
                        | Tel:{' '}
                        <a
                          href={`tel:${order.phone}`}
                          style={{
                            color:
                              '#2563eb',
                            fontWeight:
                              'bold'
                          }}
                        >
                          {
                            order.phone
                          }
                        </a>
                      </p>

                      <p
                        style={{
                          fontSize:
                            '0.85rem',
                          color:
                            '#4b5563'
                        }}
                      >
                        Alıcı:{' '}
                        {
                          order.buyer
                        }{' '}
                        | Ödeme:{' '}
                        {
                          order.paymentMethod
                        }
                      </p>

                      <div
                        style={{
                          marginTop:
                            '10px',
                          padding:
                            '8px',
                          backgroundColor:
                            '#eef2ff',
                          borderRadius:
                            '6px',
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          gap:
                            '8px',
                          flexWrap:
                            'wrap'
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              '0.9rem',
                            fontWeight:
                              'bold',
                            color:
                              '#4f46e5'
                          }}
                        >
                          Durum:{' '}
                          {
                            order.status
                          }
                        </span>

                        {currentUser &&
                          currentUser.username ===
                            order.artist && (
                            <select
                              value={
                                order.status
                              }
                              onChange={(
                                e
                              ) =>
                                updateOrderStatus(
                                  order.id,
                                  e.target
                                    .value
                                )
                              }
                              style={{
                                padding:
                                  '4px',
                                borderRadius:
                                  '4px',
                                fontSize:
                                  '0.8rem'
                              }}
                            >
                              <option value="Sipariş Alındı (Hazırlanıyor)">
                                Hazırlanıyor
                              </option>

                              <option value="Kargoya Verildi (Yolda)">
                                Kargoya
                                Verildi
                              </option>

                              <option value="Teslim Edildi">
                                Teslim
                                Edildi
                              </option>
                            </select>
                          )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =====================================================
          GİRİŞ / KAYIT MODALI
      ===================================================== */}

      {showAuthModal && (
        <div
          onClick={() =>
            setShowAuthModal(false)
          }
          style={{
            position:
              'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0,0,0,0.6)',
            display:
              'flex',
            justifyContent:
              'center',
            alignItems:
              'center',
            zIndex: 1100,
            padding:
              '16px'
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              backgroundColor:
                'white',
              borderRadius:
                '12px',
              maxWidth:
                '360px',
              width:
                '100%',
              padding:
                '20px'
            }}
          >
            <h3>
              {authMode ===
              'login'
                ? 'Giriş Yap'
                : 'Kayıt Ol'}
            </h3>

            <form
              onSubmit={
                authMode ===
                'login'
                  ? handleLogin
                  : handleRegister
              }
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '10px',
                marginTop:
                  '12px'
              }}
            >
              {authMode ===
                'register' && (
                <input
                  type="text"
                  placeholder="Kullanıcı Adı"
                  value={
                    username
                  }
                  onChange={(
                    e
                  ) =>
                    setUsername(
                      e.target.value
                    )
                  }
                  required
                  style={{
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    border:
                      '1px solid #d1d5db',
                    fontSize:
                      '16px'
                  }}
                />
              )}

              <input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(
                  e
                ) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
                style={{
                  padding:
                    '10px',
                  borderRadius:
                    '6px',
                  border:
                    '1px solid #d1d5db',
                  fontSize:
                    '16px'
                }}
              />

              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(
                  e
                ) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
                style={{
                  padding:
                    '10px',
                  borderRadius:
                    '6px',
                  border:
                    '1px solid #d1d5db',
                  fontSize:
                    '16px'
                }}
              />

              <button
                type="submit"
                style={{
                  backgroundColor:
                    '#4f46e5',
                  color:
                    'white',
                  border:
                    'none',
                  padding:
                    '10px',
                  borderRadius:
                    '6px',
                  fontWeight:
                    'bold',
                  cursor:
                    'pointer'
                }}
              >
                {authMode ===
                'login'
                  ? 'Giriş Yap'
                  : 'Kayıt Ol'}
              </button>
            </form>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                marginTop:
                  '12px',
                fontSize:
                  '0.85rem',
                gap: '8px'
              }}
            >
              <button
                onClick={() =>
                  setAuthMode(
                    authMode ===
                      'login'
                      ? 'register'
                      : 'login'
                  )
                }
                style={{
                  background:
                    'none',
                  border:
                    'none',
                  color:
                    '#2563eb',
                  cursor:
                    'pointer',
                  textAlign:
                    'left'
                }}
              >
                {authMode ===
                'login'
                  ? 'Hesabın yok mu? Kayıt ol'
                  : 'Zaten hesabın var mı? Giriş yap'}
              </button>

              <button
                onClick={() =>
                  setShowAuthModal(
                    false
                  )
                }
                style={{
                  background:
                    'none',
                  border:
                    'none',
                  color:
                    '#9ca3af',
                  cursor:
                    'pointer'
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ÖDEME MODALI
      ===================================================== */}

      {showPaymentModal && (
        <div
          onClick={() => {
            setShowPaymentModal(
              false
            );
            setShowExchangeInfo(
              false
            );
          }}
          style={{
            position:
              'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0,0,0,0.6)',
            display:
              'flex',
            justifyContent:
              'center',
            alignItems:
              'center',
            zIndex: 1100,
            padding:
              '16px'
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              backgroundColor:
                'white',
              borderRadius:
                '12px',
              maxWidth:
                '400px',
              width:
                '100%',
              padding:
                '20px'
            }}
          >
            <h3>
              Ödeme Yöntemi
              Seçin
            </h3>

            <p
              style={{
                fontSize:
                  '0.85rem',
                color:
                  '#6b7280',
                margin:
                  '10px 0'
              }}
            >
              {
                pendingArtData?.title
              }{' '}
              için ödeme
              yöntemi:
            </p>

            {!showExchangeInfo ? (
              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '10px'
                }}
              >
                <button
                  onClick={() =>
                    setShowExchangeInfo(
                      true
                    )
                  }
                  style={{
                    backgroundColor:
                      '#4f46e5',
                    color:
                      'white',
                    border:
                      'none',
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    fontWeight:
                      'bold',
                    cursor:
                      'pointer'
                  }}
                >
                  🏦 Kripto Borsa /
                  IBAN Transferi
                </button>

                <button
                  onClick={() =>
                    createNewOrder(
                      'MetaMask / Web3'
                    )
                  }
                  style={{
                    backgroundColor:
                      '#f6851b',
                    color:
                      'white',
                    border:
                      'none',
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    fontWeight:
                      'bold',
                    cursor:
                      'pointer'
                  }}
                >
                  🦊 MetaMask ile Öde
                </button>

                <button
                  onClick={() => {
                    setShowPaymentModal(
                      false
                    );
                    setShowExchangeInfo(
                      false
                    );
                    setPendingArtData(
                      null
                    );
                  }}
                  style={{
                    backgroundColor:
                      '#9ca3af',
                    color:
                      'white',
                    border:
                      'none',
                    padding:
                      '8px',
                    borderRadius:
                      '6px',
                    cursor:
                      'pointer'
                  }}
                >
                  İptal
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    backgroundColor:
                      '#f9fafb',
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    fontSize:
                      '0.85rem',
                    marginBottom:
                      '10px',
                    border:
                      '1px solid #e5e7eb'
                  }}
                >
                  <p>
                    <b>
                      Platform
                      Cüzdan
                      Adresi:
                    </b>
                  </p>

                  <code
                    style={{
                      wordBreak:
                        'break-all',
                      color:
                        '#d97706'
                    }}
                  >
                    {
                      platformWalletAddress
                    }
                  </code>

                  <p
                    style={{
                      marginTop:
                        '8px'
                    }}
                  >
                    <b>
                      Tutar:
                    </b>{' '}
                    {
                      pendingArtData?.price
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    createNewOrder(
                      'Borsa / IBAN Transferi'
                    )
                  }
                  style={{
                    backgroundColor:
                      '#059669',
                    color:
                      'white',
                    border:
                      'none',
                    padding:
                      '10px',
                    borderRadius:
                      '6px',
                    width:
                      '100%',
                    fontWeight:
                      'bold',
                    cursor:
                      'pointer',
                    marginBottom:
                      '6px'
                  }}
                >
                  Transferi Yaptım,
                  Siparişi
                  Tamamla
                </button>

                <button
                  onClick={() =>
                    setShowExchangeInfo(
                      false
                    )
                  }
                  style={{
                    background:
                      'none',
                    border:
                      'none',
                    color:
                      '#4f46e5',
                    cursor:
                      'pointer',
                    width:
                      '100%'
                  }}
                >
                  Geri Dön
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          ESER DETAY MODALI
      ===================================================== */}

      {selectedArt && (
        <div
          onClick={() =>
            setSelectedArt(null)
          }
          style={{
            position:
              'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0,0,0,0.6)',
            display:
              'flex',
            justifyContent:
              'center',
            alignItems:
              'center',
            zIndex: 1100,
            padding:
              '16px'
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              backgroundColor:
                'white',
              borderRadius:
                '12px',
              maxWidth:
                '400px',
              width:
                '100%',
              padding:
                '20px',
              position:
                'relative',
              maxHeight:
                '90vh',
              overflowY:
                'auto'
            }}
          >
            <button
              onClick={() =>
                setSelectedArt(
                  null
                )
              }
              style={{
                position:
                  'absolute',
                top: '10px',
                right: '10px',
                border:
                  'none',
                background:
                  'white',
                fontSize:
                  '1.2rem',
                cursor:
                  'pointer',
                zIndex: 2,
                borderRadius:
                  '50%'
              }}
            >
              ✕
            </button>

            <img
              src={
                selectedArt.image
              }
              alt={
                selectedArt.title
              }
              onError={(
                e
              ) => {
                e.currentTarget.src =
                  'https://picsum.photos/seed/default/1200/800';
              }}
              style={{
                width:
                  '100%',
                height:
                  '180px',
                objectFit:
                  'cover',
                borderRadius:
                  '8px',
                marginBottom:
                  '10px'
              }}
            />

            <h3>
              {
                selectedArt.title
              }
            </h3>

            <p
              style={{
                fontSize:
                  '0.85rem',
                color:
                  '#6b7280'
              }}
            >
              Sanatçı:{' '}
              {
                selectedArt.artist
              }
            </p>

            <p
              style={{
                fontSize:
                  '0.85rem',
                color:
                  '#059669',
                marginBottom:
                  '8px'
              }}
            >
              📞 İletişim Tel:{' '}
              <a
                href={`tel:${selectedArt.phone}`}
                style={{
                  color:
                    '#2563eb'
                }}
              >
                {
                  selectedArt.phone
                }
              </a>
            </p>

            <p
              style={{
                fontSize:
                  '0.9rem',
                marginBottom:
                  '14px'
              }}
            >
              {
                selectedArt.description
              }
            </p>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                gap:
                  '10px'
              }}
            >
              <span
                style={{
                  fontWeight:
                    'bold',
                  color:
                    '#059669'
                }}
              >
                {
                  selectedArt.price
                }
              </span>

              <button
                onClick={() => {
                  const art =
                    selectedArt;

                  setSelectedArt(
                    null
                  );

                  triggerBuyProcess(
                    art
                  );
                }}
                style={{
                  backgroundColor:
                    '#10b981',
                  color:
                    'white',
                  border:
                    'none',
                  padding:
                    '8px 14px',
                  borderRadius:
                    '6px',
                  fontWeight:
                    'bold',
                  cursor:
                    'pointer'
                }}
              >
                Satın Al
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
