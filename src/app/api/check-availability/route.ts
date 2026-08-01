import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../../lib/firebase';

// API untuk cek apakah username dan email sudah terdaftar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, nik } = body;

    console.log('🔍 Checking username/email/NIK availability:', { username, email, nik });

    const masyarakatCollection = collection(firestore, 'masyarakat');
    const results: {
      usernameExists: boolean;
      emailExists: boolean;
      nikExists: boolean;
      message: string;
    } = {
      usernameExists: false,
      emailExists: false,
      nikExists: false,
      message: 'Available'
    };

    // Cek username jika ada
    if (username) {
      const usernameQuery = query(masyarakatCollection, where('userName', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);
      results.usernameExists = !usernameSnapshot.empty;
      
      if (results.usernameExists) {
        console.log('❌ Username already exists:', username);
        results.message = 'Username sudah digunakan';
      }
    }

    // Cek email jika ada
    if (email) {
      const emailQuery = query(masyarakatCollection, where('email', '==', email));
      const emailSnapshot = await getDocs(emailQuery);
      results.emailExists = !emailSnapshot.empty;
      
      if (results.emailExists) {
        console.log('❌ Email already exists:', email);
        results.message = 'Email sudah terdaftar';
      }
    }

    // Cek NIK jika ada
    if (nik) {
      const nikQuery = query(masyarakatCollection, where('idNumber', '==', nik));
      const nikSnapshot = await getDocs(nikQuery);
      results.nikExists = !nikSnapshot.empty;
      
      if (results.nikExists) {
        console.log('❌ NIK already exists:', nik);
        results.message = 'NIK sudah terdaftar';
      }
    }

    // Tentukan success berdasarkan hasil pengecekan
    const isAvailable = !results.usernameExists && !results.emailExists && !results.nikExists;

    return NextResponse.json(
      {
        success: isAvailable,
        ...results
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error checking availability:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal memeriksa ketersediaan data',
        usernameExists: false,
        emailExists: false,
        nikExists: false
      },
      { status: 500 }
    );
  }
}
