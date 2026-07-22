-- Enable Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFILES (Data Guru & Admin)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nip VARCHAR(20) UNIQUE,
    nama VARCHAR(100) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('guru', 'admin')) DEFAULT 'guru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL SETTINGS SEKOLAH (Koordinat & Token QR)
CREATE TABLE public.school_settings (
    id INT PRIMARY KEY DEFAULT 1,
    nama_sekolah VARCHAR(100) DEFAULT 'MI NUR AZIZ',
    qr_secret_token VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,  -- Lat MI Nur Aziz
    longitude DOUBLE PRECISION NOT NULL, -- Long MI Nur Aziz
    max_radius_meters INT DEFAULT 50,    -- Max radius GPS
    jam_masuk TIME DEFAULT '07:00:00',
    jam_pulang TIME DEFAULT '14:00:00'
);

-- 3. TABEL ABSENSI (ATTENDANCE)
CREATE TABLE public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu_masuk TIME,
    waktu_pulang TIME,
    status_masuk VARCHAR(20) DEFAULT 'Tepat Waktu', -- 'Tepat Waktu', 'Terlambat'
    status_kehadiran VARCHAR(20) DEFAULT 'Hadir',   -- 'Hadir', 'Izin', 'Sakit', 'Alpha'
    distance_masuk_meters INT,
    distance_pulang_meters INT,
    keterangan TEXT,                                -- Diisi jika Izin/Sakit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_per_date UNIQUE (user_id, tanggal)
);

-- INDEX PERFORMA QUERY
CREATE INDEX idx_attendances_tanggal ON public.attendances(tanggal);
CREATE INDEX idx_attendances_user ON public.attendances(user_id);

-- FUNCTION UNTUK MENGHINDARI INFINITE RECURSION DI RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Profil: Guru hanya bisa lihat profilnya sendiri, Admin bisa lihat semua
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can update profiles" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin(auth.uid()));

-- School Settings: Semua authenticated user bisa SELECT
CREATE POLICY "Anyone authenticated can view settings" ON public.school_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can update settings" ON public.school_settings FOR UPDATE USING (public.is_admin(auth.uid()));

-- Attendances: Guru bisa CRUD miliknya sendiri (terutama update waktu pulang), Admin bisa CRUD semua
CREATE POLICY "Users can view own attendances" ON public.attendances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendances" ON public.attendances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendances" ON public.attendances FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all attendances" ON public.attendances FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can manage all attendances" ON public.attendances FOR ALL USING (public.is_admin(auth.uid()));


-- Insert Default Settings
INSERT INTO public.school_settings (id, nama_sekolah, qr_secret_token, latitude, longitude, max_radius_meters, jam_masuk, jam_pulang)
VALUES (1, 'MI NUR AZIZ', 'SIAZIZ-QR-TOKEN-INITIAL-12345', -6.200000, 106.816666, 50, '07:00:00', '14:00:00')
ON CONFLICT (id) DO NOTHING;
