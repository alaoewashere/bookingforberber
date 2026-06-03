import type { AppointmentStatus } from "@/lib/types";

export const ar = {
  nav: {
    home: "الرئيسية",
    admin: "الإدارة",
  },
  home: {
    title: "أيام الجدول",
    subtitle: "افتح يوماً لعرض الحجوزات وحجز مواعيد كل ساعة.",
    openToday: "جدول اليوم",
    addDay: "إضافة يوم جديد",
    noDays: "لا توجد أيام في الجدول بعد.",
    addFirstDay: "أضف أول يوم",
    today: "اليوم",
  },
  day: {
    backDays: "كل الأيام",
    backHome: "الرئيسية",
    hoursRange: "٩:٠٠ ص – ٧:٠٠ م",
    bookedCount: (n: number) => `${n} محجوز`,
    otherCount: (n: number) => `${n} متاح أو مغلق`,
    loadError:
      "تعذّر تحميل الجدول. تحقق من إعدادات Supabase وشغّل ملف SQL للجدول.",
  },
  slot: {
    available: "متاح",
    booked: "محجوز",
    blocked: "مغلق",
    unavailable: "غير متاح",
  },
  booking: {
    title: "حجز موعد",
    customerName: "اسم العميل",
    placeholder: "مثال: علي",
    cancel: "إلغاء",
    save: "تأكيد الحجز",
    saving: "جاري الحفظ…",
    nameRequired: "يرجى إدخال اسم العميل",
    saveFailed: "فشل الحفظ",
  },
  addDay: {
    title: "إضافة يوم جديد",
    subtitle: "يُنشئ كل المواعيد من ٩:٠٠ ص إلى ٧:٠٠ م (كل ساعة).",
    cancel: "إلغاء",
    create: "إنشاء الجدول",
    creating: "جاري الإنشاء…",
    failed: "فشل الإنشاء",
    createDayFailed: "فشل إنشاء اليوم",
  },
  admin: {
    title: "الإدارة",
    subtitle: "إدارة جميع المواعيد",
    logout: "تسجيل الخروج",
    loginTitle: "دخول الإدارة",
    loginSubtitle: "أدخل كلمة مرور الإدارة للمتابعة.",
    password: "كلمة المرور",
    signIn: "دخول",
    checking: "جاري التحقق…",
    invalidPassword: "كلمة المرور غير صحيحة",
    loginFailed: "فشل تسجيل الدخول",
    allAppointments: "كل المواعيد",
    addBooking: "+ إضافة حجز",
    cancel: "إلغاء",
    customerName: "اسم العميل",
    saveBooking: "حفظ الحجز",
    date: "التاريخ",
    time: "الوقت",
    customer: "العميل",
    status: "الحالة",
    actions: "إجراءات",
    empty: "لا توجد مواعيد بعد. أضف يوماً من الصفحة الرئيسية أو أنشئ حجزاً أعلاه.",
    edit: "تعديل",
    save: "حفظ",
    clear: "مسح",
    block: "إغلاق",
    clearConfirm: "هل تريد مسح هذا الحجز؟",
    updateFailed: "فشل التحديث",
    addFailed: "فشل الإضافة",
    dash: "—",
  },
  notFound: {
    title: "الصفحة غير موجودة",
    home: "الرئيسية",
  },
  meta: {
    title: "جدول الحلاقة",
    description: "حجز مواعيد الحلاقة",
  },
} as const;

export function statusLabelAr(status: AppointmentStatus): string {
  return ar.slot[status];
}
