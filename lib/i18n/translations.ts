export type CustomerT = {
  nav: { home: string; admin: string };
  home: {
    title: string;
    subtitle: string;
    welcome: string;
    prevWeek: string;
    nextWeek: string;
    loading: string;
    noSlots: string;
    today: string;
  };
  weekdays: string[];
  months: string[];
  slot: { available: string; booked: string; blocked: string };
  services: { hair: string; beard: string; hair_beard: string };
  booking: {
    title: string;
    customerName: string;
    placeholder: string;
    phone: string;
    phonePlaceholder: string;
    service: string;
    cancel: string;
    save: string;
    saving: string;
    nameRequired: string;
    phoneRequired: string;
    serviceRequired: string;
    saveFailed: string;
    alreadyBooked: string;
    successTitle: string;
    successSub: string;
  };
  footer: { support: string };
  dir: "rtl" | "ltr";
  locale: string;
};

export const arT: CustomerT = {
  nav: { home: "الرئيسية", admin: "الإدارة" },
  home: {
    title: "احجز موعدك",
    subtitle: "اختر يوماً من الاثنين إلى السبت — من ١٢ ظهراً حتى ١٠ مساءً",
    welcome: "مرحباً بك",
    prevWeek: "الأسبوع السابق",
    nextWeek: "الأسبوع القادم",
    loading: "جاري التحميل...",
    noSlots: "لا توجد مواعيد",
    today: "اليوم",
  },
  weekdays: ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
  months: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
  slot: { available: "متاح", booked: "محجوز", blocked: "مغلق" },
  services: { hair: "شعر فقط", beard: "لحية فقط", hair_beard: "شعر ولحية" },
  booking: {
    title: "حجز موعد",
    customerName: "الاسم",
    placeholder: "مثال: علي",
    phone: "رقم الهاتف",
    phonePlaceholder: "+90 5...",
    service: "نوع الخدمة",
    cancel: "إلغاء",
    save: "تأكيد الحجز",
    saving: "جاري الحفظ…",
    nameRequired: "يرجى إدخال الاسم",
    phoneRequired: "يرجى إدخال رقم الهاتف",
    serviceRequired: "يرجى اختيار نوع الخدمة",
    saveFailed: "فشل الحفظ",
    alreadyBooked: "هذا الموعد محجوز بالفعل",
    successTitle: "تم",
    successSub: "تم تسجيل موعدك بنجاح",
  },
  footer: { support: "للدعم والاستفسار:" },
  dir: "rtl",
  locale: "ar-SA-u-ca-gregory",
};

export const enT: CustomerT = {
  nav: { home: "Home", admin: "Admin" },
  home: {
    title: "Book Appointment",
    subtitle: "Monday to Saturday — 12 PM to 10 PM",
    welcome: "Welcome",
    prevWeek: "Previous Week",
    nextWeek: "Next Week",
    loading: "Loading...",
    noSlots: "No appointments",
    today: "Today",
  },
  weekdays: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  slot: { available: "Available", booked: "Booked", blocked: "Closed" },
  services: { hair: "Hair Only", beard: "Beard Only", hair_beard: "Hair & Beard" },
  booking: {
    title: "Book Appointment",
    customerName: "Full Name",
    placeholder: "e.g. Ali",
    phone: "Phone",
    phonePlaceholder: "+1 ...",
    service: "Service Type",
    cancel: "Cancel",
    save: "Confirm",
    saving: "Saving…",
    nameRequired: "Please enter your name",
    phoneRequired: "Please enter your phone number",
    serviceRequired: "Please select a service",
    saveFailed: "Booking failed",
    alreadyBooked: "This slot is already booked",
    successTitle: "Done",
    successSub: "Your appointment has been booked",
  },
  footer: { support: "For support:" },
  dir: "ltr",
  locale: "en-US",
};

export const trT: CustomerT = {
  nav: { home: "Ana Sayfa", admin: "Yönetim" },
  home: {
    title: "Randevu Al",
    subtitle: "Pazartesi'den Cumartesi'ye — öğle 12:00'dan gece 22:00'a kadar",
    welcome: "Hoş Geldiniz",
    prevWeek: "Önceki Hafta",
    nextWeek: "Sonraki Hafta",
    loading: "Yükleniyor...",
    noSlots: "Randevu yok",
    today: "Bugün",
  },
  weekdays: ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"],
  months: ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],
  slot: { available: "Müsait", booked: "Dolu", blocked: "Kapalı" },
  services: { hair: "Sadece Saç", beard: "Sadece Sakal", hair_beard: "Saç ve Sakal" },
  booking: {
    title: "Randevu Al",
    customerName: "Ad Soyad",
    placeholder: "örn: Ali",
    phone: "Telefon",
    phonePlaceholder: "+90 5...",
    service: "Hizmet Türü",
    cancel: "İptal",
    save: "Onayla",
    saving: "Kaydediliyor…",
    nameRequired: "Lütfen adınızı girin",
    phoneRequired: "Lütfen telefon numaranızı girin",
    serviceRequired: "Lütfen hizmet türü seçin",
    saveFailed: "Kayıt başarısız",
    alreadyBooked: "Bu randevu zaten alınmış",
    successTitle: "Onaylandı",
    successSub: "Randevunuz başarıyla kaydedildi",
  },
  footer: { support: "Destek için:" },
  dir: "ltr",
  locale: "tr-TR",
};
